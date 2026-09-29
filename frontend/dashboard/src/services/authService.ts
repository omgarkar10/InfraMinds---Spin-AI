import { auth } from "../config/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signInWithCredential,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { googleProvider, db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080/api`;

export async function getCountriesConfig() {
  const response = await fetch(`${API_URL}/config/countries`);
  if (!response.ok) {
    throw new Error("Failed to load country configuration");
  }
  return response.json();
}

export async function getAuthConfig() {
  const response = await fetch(`${API_URL}/config/auth`);
  if (!response.ok) {
    throw new Error("Failed to load authentication configuration");
  }
  return response.json();
}

export async function getCaptchaChallenge() {
  const response = await fetch(`${API_URL}/auth/captcha`);
  if (!response.ok) {
    throw new Error("Failed to load CAPTCHA challenge");
  }
  return response.json();
}

function getFriendlyAuthErrorMessage(error: any): string {
  const code = error?.code || "";
  switch (code) {
    case "auth/unauthorized-domain":
      return "This domain is not authorized. Please add localhost to Firebase Console -> Authentication -> Authorized Domains.";
    case "auth/operation-not-allowed":
      return "This login method is disabled. Please enable Google Sign-In in Firebase Console -> Authentication -> Sign-in method.";
    case "auth/email-already-in-use":
      return "An account with this phone number already exists.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/user-not-found":
      return "Incorrect phone number or password.";
    case "auth/popup-closed-by-user":
      return "Google Sign-in was cancelled.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection or adblocker.";
    case "auth/too-many-requests":
      return "Too many failed login attempts. Please try again later.";
    default:
      return error?.message || "Authentication failed. Please try again.";
  }
}

// Removed synthetic email logic

export async function citizenSignup(payload: {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
  dob: string;
  captcha_token?: string;
  captcha_answer?: string;
}) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
    
    await updateProfile(userCredential.user, {
      displayName: payload.name,
    });
    
    const token = await userCredential.user.getIdToken();
    localStorage.setItem("citizen_token", token);
    
    return {
      user: {
        id: userCredential.user.uid,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        dob: payload.dob
      },
      access_token: token
    };
  } catch (error: any) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

export async function citizenGoogleLogin(idToken: string) {
  // If using Google Identity Services (GIS) credential token directly
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const token = await userCredential.user.getIdToken();
    localStorage.setItem("citizen_token", token);
    
    return {
      user: {
        id: userCredential.user.uid,
        name: userCredential.user.displayName || "Citizen",
        phone: userCredential.user.phoneNumber || "",
        email: userCredential.user.email
      },
      access_token: token
    };
  } catch (error: any) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

export async function citizenLogin(payload: { email: string; password: string; }) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, payload.email, payload.password);
    const token = await userCredential.user.getIdToken();
    
    localStorage.setItem("citizen_token", token);
    
    return {
      user: {
        id: userCredential.user.uid,
        name: userCredential.user.displayName || "Citizen",
        phone: "", // In a real app, fetch from Firestore
        email: payload.email
      },
      access_token: token
    };
  } catch (error: any) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

export async function citizenFirebaseGoogleLogin() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    localStorage.setItem("citizen_token", token);
    
    // Check if the user already has a complete profile in Firestore
    const userDocRef = doc(db, "users", result.user.uid);
    let isComplete = false;
    let phone = result.user.phoneNumber || "";
    let dob = "";
    
    try {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.phone && data.dob) {
          isComplete = true;
          phone = data.phone;
          dob = data.dob;
        }
      }
    } catch (e) {
      console.warn("Firestore offline or unavailable, treating as new user.", e);
    }
    
    return {
      user: {
        id: result.user.uid,
        name: result.user.displayName || "Citizen",
        phone: phone,
        email: result.user.email || "",
        dob: dob
      },
      isNewUser: !isComplete, // If profile is complete, treat as returning user
      access_token: token
    };
  } catch (error: any) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}



export async function citizenForgotPassword(_payload: { countryCode: string; phone: string; }) {
  // Phone password reset usually requires SMS OTP in Firebase.
  // We mock this or link to a backend endpoint if using synthetic email
  throw new Error("Password reset flow needs SMS OTP integration.");
}

export async function citizenResetPassword(_payload: { phone: string; password: string; }) {
  throw new Error("Password reset flow needs SMS OTP integration.");
}

export function citizenLogout() {
  localStorage.removeItem("citizen_token");
  auth.signOut();
}

export async function staffLogin(identifier: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
    const tokenResult = await userCredential.user.getIdTokenResult(true);
    const token = tokenResult.token;
    let role = (tokenResult.claims.role as string) || "Department Officer";
    let department = (tokenResult.claims.department as string) || "General Administration";
    let name = userCredential.user.displayName || `${department} ${role}`;
    
    localStorage.setItem("staff_token", token);
    
    return {
      user: {
        id: userCredential.user.uid,
        name: name,
        email: userCredential.user.email,
        employeeId: "EMP-" + userCredential.user.uid.substring(0,5).toUpperCase(),
        department: department,
        role: role
      },
      access_token: token
    };
  } catch (error: any) {
    throw new Error(error.message || "Invalid credentials.");
  }
}
