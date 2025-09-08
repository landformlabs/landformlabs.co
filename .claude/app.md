# App
The website should include an app at `/app` that allows users to upload a .gpx file, see the route on a map, and draw a square bounding box around the area they would like to use for the print. The app should have the following features:
1. File Upload: A file input that accepts .gpx files and reads the file contents.
2. Map Display: Use a mapping library (e.g., Leaflet or Mapbox) to display the route from the .gpx file on an interactive map.
3. Bounding Box Drawing: Allow users to draw a square bounding box on the map to select the area for the print. This square box should account for the mercator projection distortion and represent a square in real-world dimensions.
4. Copy a comma separated list of the bounding box coordinates (lat/lon) to the clipboard: for example "-122.55928,37.70740,-122.34716,37.85082"

This should all be accomplished client-side in the browser using React and Next.js. No server-side processing is required.
