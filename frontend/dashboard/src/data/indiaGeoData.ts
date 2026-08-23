// India States & Districts — Complete dataset for all 36 States/UTs
// Source: Government of India administrative boundaries

export interface StateData {
  state: string;
  code: string;
  districts: string[];
}

export const INDIA_STATES_DISTRICTS: StateData[] = [
  {
    state: "Andhra Pradesh", code: "AP",
    districts: ["Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla", "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur", "Kakinada", "Krishna", "Kurnool", "Nandyal", "NTR", "Palnadu", "Parvathipuram Manyam", "Prakasam", "Sri Potti Sriramulu Nellore", "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"]
  },
  {
    state: "Arunachal Pradesh", code: "AR",
    districts: ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke-Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Dibang Valley", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"]
  },
  {
    state: "Assam", code: "AS",
    districts: ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"]
  },
  {
    state: "Bihar", code: "BR",
    districts: ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"]
  },
  {
    state: "Chhattisgarh", code: "CG",
    districts: ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Khairagarh-Chhuikhadan-Gandai", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sarangarh-Bilaigarh", "Shakti", "Sukma", "Surajpur", "Surguja"]
  },
  {
    state: "Goa", code: "GA",
    districts: ["North Goa", "South Goa"]
  },
  {
    state: "Gujarat", code: "GJ",
    districts: ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"]
  },
  {
    state: "Haryana", code: "HR",
    districts: ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"]
  },
  {
    state: "Himachal Pradesh", code: "HP",
    districts: ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"]
  },
  {
    state: "Jharkhand", code: "JH",
    districts: ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"]
  },
  {
    state: "Karnataka", code: "KA",
    districts: ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapura", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davangere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"]
  },
  {
    state: "Kerala", code: "KL",
    districts: ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"]
  },
  {
    state: "Madhya Pradesh", code: "MP",
    districts: ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"]
  },
  {
    state: "Maharashtra", code: "MH",
    districts: ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"]
  },
  {
    state: "Manipur", code: "MN",
    districts: ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"]
  },
  {
    state: "Meghalaya", code: "ML",
    districts: ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "Eastern West Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"]
  },
  {
    state: "Mizoram", code: "MZ",
    districts: ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip"]
  },
  {
    state: "Nagaland", code: "NL",
    districts: ["Chumoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren", "Phek", "Shamator", "Tseminyu", "Tuensang", "Wokha", "Zunheboto"]
  },
  {
    state: "Odisha", code: "OD",
    districts: ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Sonepur", "Sundargarh"]
  },
  {
    state: "Punjab", code: "PB",
    districts: ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Mohali", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "Shaheed Bhagat Singh Nagar", "Tarn Taran"]
  },
  {
    state: "Rajasthan", code: "RJ",
    districts: ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"]
  },
  {
    state: "Sikkim", code: "SK",
    districts: ["East Sikkim", "North Sikkim", "Pakyong", "Soreng", "South Sikkim", "West Sikkim"]
  },
  {
    state: "Tamil Nadu", code: "TN",
    districts: ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Villupuram", "Virudhunagar"]
  },
  {
    state: "Telangana", code: "TS",
    districts: ["Adilabad", "Bhadradri Kothagudem", "Hanumakonda", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"]
  },
  {
    state: "Tripura", code: "TR",
    districts: ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"]
  },
  {
    state: "Uttar Pradesh", code: "UP",
    districts: ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Rae Bareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"]
  },
  {
    state: "Uttarakhand", code: "UK",
    districts: ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"]
  },
  {
    state: "West Bengal", code: "WB",
    districts: ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"]
  },
  // Union Territories
  {
    state: "Andaman and Nicobar Islands", code: "AN",
    districts: ["Nicobar", "North and Middle Andaman", "South Andaman"]
  },
  {
    state: "Chandigarh", code: "CH",
    districts: ["Chandigarh"]
  },
  {
    state: "Dadra and Nagar Haveli and Daman and Diu", code: "DN",
    districts: ["Dadra and Nagar Haveli", "Daman", "Diu"]
  },
  {
    state: "Delhi", code: "DL",
    districts: ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"]
  },
  {
    state: "Jammu and Kashmir", code: "JK",
    districts: ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"]
  },
  {
    state: "Ladakh", code: "LA",
    districts: ["Kargil", "Leh"]
  },
  {
    state: "Lakshadweep", code: "LD",
    districts: ["Lakshadweep"]
  },
  {
    state: "Puducherry", code: "PY",
    districts: ["Karaikal", "Mahe", "Puducherry", "Yanam"]
  },
];

export const STATE_CENTROIDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  "Andhra Pradesh": { lat: 15.9129, lng: 79.7400, zoom: 7 },
  "Arunachal Pradesh": { lat: 28.2180, lng: 94.7278, zoom: 7 },
  "Assam": { lat: 26.2006, lng: 92.9376, zoom: 7 },
  "Bihar": { lat: 25.0961, lng: 85.3131, zoom: 7 },
  "Chhattisgarh": { lat: 21.2787, lng: 81.8661, zoom: 7 },
  "Goa": { lat: 15.2993, lng: 74.1240, zoom: 10 },
  "Gujarat": { lat: 22.2587, lng: 71.1924, zoom: 7 },
  "Haryana": { lat: 29.0588, lng: 76.0856, zoom: 8 },
  "Himachal Pradesh": { lat: 31.1048, lng: 77.1734, zoom: 8 },
  "Jharkhand": { lat: 23.6102, lng: 85.2799, zoom: 7 },
  "Karnataka": { lat: 15.3173, lng: 75.7139, zoom: 7 },
  "Kerala": { lat: 10.8505, lng: 76.2711, zoom: 8 },
  "Madhya Pradesh": { lat: 22.9734, lng: 78.6569, zoom: 6 },
  "Maharashtra": { lat: 19.7515, lng: 75.7139, zoom: 7 },
  "Manipur": { lat: 24.6637, lng: 93.9063, zoom: 8 },
  "Meghalaya": { lat: 25.4670, lng: 91.3662, zoom: 8 },
  "Mizoram": { lat: 23.1645, lng: 92.9376, zoom: 8 },
  "Nagaland": { lat: 26.1584, lng: 94.5624, zoom: 8 },
  "Odisha": { lat: 20.9517, lng: 85.0985, zoom: 7 },
  "Punjab": { lat: 31.1471, lng: 75.3412, zoom: 8 },
  "Rajasthan": { lat: 27.0238, lng: 74.2179, zoom: 6 },
  "Sikkim": { lat: 27.5330, lng: 88.5122, zoom: 9 },
  "Tamil Nadu": { lat: 11.1271, lng: 78.6569, zoom: 7 },
  "Telangana": { lat: 18.1124, lng: 79.0193, zoom: 7 },
  "Tripura": { lat: 23.9408, lng: 91.9882, zoom: 8 },
  "Uttar Pradesh": { lat: 26.8467, lng: 80.9462, zoom: 6 },
  "Uttarakhand": { lat: 30.0668, lng: 79.0193, zoom: 8 },
  "West Bengal": { lat: 22.9868, lng: 87.8550, zoom: 7 },
  "Andaman and Nicobar Islands": { lat: 11.7401, lng: 92.6586, zoom: 7 },
  "Chandigarh": { lat: 30.7333, lng: 76.7794, zoom: 12 },
  "Dadra and Nagar Haveli and Daman and Diu": { lat: 20.1809, lng: 73.0169, zoom: 9 },
  "Delhi": { lat: 28.7041, lng: 77.1025, zoom: 11 },
  "Jammu and Kashmir": { lat: 33.7782, lng: 76.5762, zoom: 7 },
  "Ladakh": { lat: 34.1526, lng: 77.5771, zoom: 7 },
  "Lakshadweep": { lat: 10.5667, lng: 72.6417, zoom: 9 },
  "Puducherry": { lat: 11.9416, lng: 79.8083, zoom: 11 },
};

// Common District Coordinates for precision zooming
export const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Andhra Pradesh
  "East Godavari": { lat: 16.9891, lng: 82.2475 },
  "Visakhapatnam": { lat: 17.6868, lng: 83.2185 },
  "Guntur": { lat: 16.3067, lng: 80.4365 },
  "Krishna": { lat: 16.1809, lng: 81.1303 },
  "Chittoor": { lat: 13.2172, lng: 79.1003 },
  "Kurnool": { lat: 15.8281, lng: 78.0373 },
  "Tirupati": { lat: 13.6288, lng: 79.4192 },
  "West Godavari": { lat: 16.7107, lng: 81.0952 },
  "Nellore": { lat: 14.4426, lng: 79.9865 },
  "Ananthapuramu": { lat: 14.6819, lng: 77.6006 },
  "Kadapa": { lat: 14.4673, lng: 78.8242 },
  // Maharashtra
  "Pune": { lat: 18.5204, lng: 73.8567 },
  "Mumbai City": { lat: 18.9388, lng: 72.8354 },
  "Mumbai Suburban": { lat: 19.0760, lng: 72.8777 },
  "Nagpur": { lat: 21.1458, lng: 79.0882 },
  "Thane": { lat: 19.2183, lng: 72.9781 },
  "Nashik": { lat: 19.9975, lng: 73.7898 },
  "Aurangabad": { lat: 19.8762, lng: 75.3433 },
  "Akola": { lat: 20.7002, lng: 77.0082 },
  "Amravati": { lat: 20.9374, lng: 77.7796 },
  "Kolhapur": { lat: 16.7050, lng: 74.2433 },
  "Solapur": { lat: 17.6599, lng: 75.9064 },
  // Delhi
  "Central Delhi": { lat: 28.6448, lng: 77.2167 },
  "New Delhi": { lat: 28.6139, lng: 77.2090 },
  "South Delhi": { lat: 28.4817, lng: 77.1873 },
  // Karnataka
  "Bengaluru Urban": { lat: 12.9716, lng: 77.5946 },
  "Bengaluru Rural": { lat: 13.2847, lng: 77.5505 },
  "Mysuru": { lat: 12.2958, lng: 76.6394 },
  "Dakshina Kannada": { lat: 12.8703, lng: 75.2479 },
  "Belagavi": { lat: 15.8497, lng: 74.4977 },
  "Dharwad": { lat: 15.4589, lng: 75.0078 },
  // Tamil Nadu
  "Chennai": { lat: 13.0827, lng: 80.2707 },
  "Coimbatore": { lat: 11.0168, lng: 76.9558 },
  "Madurai": { lat: 9.9252, lng: 78.1198 },
  "Tiruchirappalli": { lat: 10.7905, lng: 78.7047 },
  "Salem": { lat: 11.6643, lng: 78.1460 },
  // Telangana
  "Hyderabad": { lat: 17.3850, lng: 78.4867 },
  "Warangal": { lat: 17.9689, lng: 79.5941 },
  "Rangareddy": { lat: 17.3000, lng: 78.5000 },
  // Uttar Pradesh
  "Lucknow": { lat: 26.8467, lng: 80.9462 },
  "Kanpur Nagar": { lat: 26.4499, lng: 80.3319 },
  "Varanasi": { lat: 25.3176, lng: 82.9739 },
  "Agra": { lat: 27.1767, lng: 78.0081 },
  "Gautam Buddha Nagar": { lat: 28.5355, lng: 77.3910 },
  "Ghaziabad": { lat: 28.6692, lng: 77.4538 },
  "Prayagraj": { lat: 25.4358, lng: 81.8463 },
  // West Bengal
  "Kolkata": { lat: 22.5726, lng: 88.3639 },
  "Howrah": { lat: 22.5958, lng: 88.2636 },
  "North 24 Parganas": { lat: 22.7210, lng: 88.4810 },
  "Darjeeling": { lat: 27.0410, lng: 88.2663 },
  // Gujarat
  "Ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "Surat": { lat: 21.1702, lng: 72.8311 },
  "Vadodara": { lat: 22.3072, lng: 73.1812 },
  "Rajkot": { lat: 22.3039, lng: 70.8022 },
  "Gandhinagar": { lat: 23.2156, lng: 72.6369 },
  // Rajasthan
  "Jaipur": { lat: 26.9124, lng: 75.7873 },
  "Jodhpur": { lat: 26.2389, lng: 73.0243 },
  "Udaipur": { lat: 24.5854, lng: 73.7125 },
  "Kota": { lat: 25.2138, lng: 75.8648 },
  // Kerala
  "Thiruvananthapuram": { lat: 8.5241, lng: 76.9366 },
  "Ernakulam": { lat: 9.9816, lng: 76.2999 },
  "Kozhikode": { lat: 11.2588, lng: 75.7804 },
  // Bihar
  "Patna": { lat: 25.5941, lng: 85.1376 },
  "Gaya": { lat: 24.7914, lng: 85.0002 },
  "Muzaffarpur": { lat: 26.1209, lng: 85.3647 },
  // Madhya Pradesh
  "Bhopal": { lat: 23.2599, lng: 77.4126 },
  "Indore": { lat: 22.7196, lng: 75.8577 },
  "Gwalior": { lat: 26.2183, lng: 78.1828 },
  "Jabalpur": { lat: 23.1815, lng: 79.9864 },
  // Punjab
  "Ludhiana": { lat: 30.9010, lng: 75.8573 },
  "Amritsar": { lat: 31.6340, lng: 74.8723 },
  "Jalandhar": { lat: 31.3260, lng: 75.5762 },
  // Haryana
  "Gurugram": { lat: 28.4595, lng: 77.0266 },
  "Faridabad": { lat: 28.4089, lng: 77.3178 },
  // Odisha
  "Khordha": { lat: 20.1901, lng: 85.6265 },
  "Cuttack": { lat: 20.4625, lng: 85.8828 },
  // Assam
  "Kamrup Metropolitan": { lat: 26.1445, lng: 91.7362 },
  // J&K
  "Srinagar": { lat: 34.0837, lng: 74.7973 },
  "Jammu": { lat: 32.7266, lng: 74.8570 },
};

export const getGeoCoordinates = (
  state?: string,
  district?: string
): { lat: number; lng: number; zoom: number } => {
  if (district && DISTRICT_COORDINATES[district]) {
    return { ...DISTRICT_COORDINATES[district], zoom: 11 };
  }
  if (state && STATE_CENTROIDS[state]) {
    return STATE_CENTROIDS[state];
  }
  // Default All-India Center
  return { lat: 20.5937, lng: 78.9629, zoom: 5 };
};

export const getDistrictsByState = (stateName: string): string[] => {
  const found = INDIA_STATES_DISTRICTS.find(
    (s) => s.state.toLowerCase() === stateName.toLowerCase()
  );
  return found ? found.districts.sort() : [];
};

export const getAllStateNames = (): string[] =>
  INDIA_STATES_DISTRICTS.map((s) => s.state).sort();

