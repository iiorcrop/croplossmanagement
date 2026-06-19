import React from 'react';

// Personal data entry page – embeds the legacy HTML data entry app.
// The HTML file is placed in the public folder and served as a static asset.
export default function Personal() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        src="/Crop_Loss_Data_Entry_App.html"
        title="Crop Loss Data Entry"
        style={{ border: 'none', width: '100%', height: '100%' }}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
