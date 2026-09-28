## Goal Description
Completely overhaul the Citizen Portal to shift focus onto community-driven "Public Demands". This redesign introduces a geospatial demand feed, interactive voting mechanics, EXIF-enabled proposal submissions, and a dedicated "My Activity" profile. It also resolves navigation bugs where logged-in citizens were inadvertently routed back to the public landing page via the Navbar logo and fixes "Sign In" button visibility edge cases.

## User Review Required
> [!NOTE]
> **Phone Auth Status:** You have confirmed that Firebase Phone Auth is enabled in your console. The implementation will utilize Firebase's official `RecaptchaVerifier` and `signInWithPhoneNumber` flow for residency verification.

> [!NOTE]
> **WhatsApp Integration:** The WhatsApp Intake Shortcut and WhatsApp Social Share buttons will be present in the UI but rendered in a greyed-out, disabled state (`disabled={true}`, `opacity: 0.5`, `cursor: not-allowed`) since the backend webhooks and business APIs are not yet configured.


## Proposed Changes

---

### Dependencies

#### [MODIFY] `frontend/dashboard/package.json`
Install Leaflet and React-Leaflet for the open-source map integration, replacing Google Maps dependencies where applicable.
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

---

### Global Navigation & Header

#### [MODIFY] `frontend/dashboard/src/components/navigation/Navbar.tsx`
Update the logo routing, add the Bhashini language switcher, location filter, and fix authentication button visibility.
```tsx
  // Fix Logo Routing
  const handleLogoClick = () => {
    if (user?.isLoggedIn) {
      onViewChange("citizen"); // Route to Main Feed, not landing
    } else {
      onViewChange("landing");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Add subtle Staff Login Icon
  <button className="staff-login-icon" onClick={() => onViewChange("staff-login")} aria-label="Staff Portal">
    <ShieldIcon size={16} />
  </button>
```

#### [MODIFY] `frontend/dashboard/src/App.tsx`
Refactor routing logic to support the new "Citizen Profile" view separate from the Main Feed, and ensure landing page sections are strictly guarded.

---

### Main Public Demand Feed (Home Screen)

#### [MODIFY] `frontend/dashboard/src/components/citizen/CitizenPortalHome.tsx`
Repurpose this component from "My Requests" to the global "Main Public Demand Feed" featuring the interactive map and feed filters.
```tsx
// Introduce Feed Filters and Map
<div className="citizen-feed-container">
  <LocationFilterSelector onChange={setContextLocation} />
  
  <div className="feed-layout">
    <div className="feed-list">
      <FeedTabs tabs={['Trending', 'Top Voted', 'Most Recent', 'Category']} active={activeTab} />
      {demands.map(demand => (
        <DemandCard 
          key={demand.id} 
          data={demand} 
          // Visual indicator on each demand card showing progress toward official review
          progressText={`${demand.votes} / ${demand.vote_threshold} votes needed`} 
        />
      ))}
    </div>
    <div className="feed-map">
      <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {demands.map(demand => (
          <Marker key={demand.id} position={[demand.lat, demand.lng]}>
            <Popup>{demand.title}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  </div>
</div>
```

---

### Submit New Demand Flow

#### [MODIFY] `frontend/dashboard/src/components/citizen/CreateDemandForm.tsx`
Overhaul the form to support the new requirement fields.
```tsx
// Add Category Picker, GPS Pin Drop, and EXIF Photo Upload
<form>
  <CategoryDropdown options={['Transit', 'Parks', 'Sanitation', 'Roads', 'Safety']} />
  
  <MapPinDrop onLocationSelect={setCoordinates} />
  
  <ExifPhotoUpload onUpload={(file, meta) => validateLocation(meta.gps)} />
  
  <input type="text" placeholder="Project Title" />
  <textarea placeholder="Outline the project proposal..." />
  
  <button type="submit">Submit Public Demand</button>
  
  {/* WhatsApp Intake Shortcut (Disabled for now) */}
  <WhatsAppShortcutBanner phoneNumber="+919876543210" disabled={true} style={{ opacity: 0.5, cursor: "not-allowed" }} />
</form>
```

---

### Demand Detail Page

#### [MODIFY] `frontend/dashboard/src/components/citizen/DemandDetail.tsx`
Add upvoting mechanics, live status pipeline, official updates log, and social sharing.
```tsx
// Add Upvote logic
const handleUpvote = async () => {
  const voteId = `${demand.id}_${user.id}`;
  await castVote(voteId);
};

<div className="demand-detail-view">
  <button onClick={handleUpvote} disabled={hasVoted}>
    {hasVoted ? 'Supported' : 'Upvote / Back This Proposal'}
  </button>
  
  <StatusPipeline currentStatus={demand.status} steps={['Gathering Support', 'Under Review', 'Field Survey', 'Approved / Budgeted', 'Fulfilled']} />
  
  <OfficialUpdatesLog logs={demand.official_updates} />
  
  <button disabled className="whatsapp-share-btn disabled">
    Share on WhatsApp (Coming Soon)
  </button>
</div>
```

---

### Citizen Dashboard ("My Activity")

#### [NEW] `frontend/dashboard/src/components/citizen/CitizenProfile.tsx`
Create a dedicated component for personal tracking (My Submissions, Supported Demands, Residency Badge).
```tsx
export function CitizenProfile({ user }) {
  return (
    <div className="profile-dashboard">
      <div className="profile-header">
        <h2>{user.name}</h2>
        {user.is_verified_resident && <span className="badge verified">Verified Resident - {user.ward}</span>}
      </div>
      
      <Tabs>
        <Tab label="My Submissions">
           <MyDemandsList />
        </Tab>
        <Tab label="Demands I Supported">
           <SupportedDemandsList />
        </Tab>
      </Tabs>
    </div>
  )
}
```

## Verification Plan

### Automated Tests
1. **Routing Verification:** Run `npx tsc --noEmit` and check that `App.tsx` correctly handles the new `citizen-profile` view state type.

### Manual Verification
1. Boot the frontend and log in as a citizen.
2. Click the Navigation Bar logo. Verify it routes to the Main Feed (`/citizen`), *not* the Landing Page.
3. Verify the "Sign In" button is entirely hidden when a user session exists, replaced by the Profile avatar.
4. Open the "Submit New Demand" flow and verify the interactive Map Pin Drop and Photo Upload fields are present.
5. Open a Demand Detail page and click the "Upvote" button, verifying it updates the progress bar and disables subsequent clicks.
