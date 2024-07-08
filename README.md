# Station Service Project
## Overview
The Station Service project is a NestJS application designed to manage and stream music files for virtual radio stations. Each station can upload and queue music files, stream them to clients, and handle multiple clients simultaneously. This service is particularly useful for creating online radio stations where users can upload music and stream it live.
## Features
* Create Stations: Dynamically create new radio stations with unique IDs.
* Upload Music: Upload music files to specific stations.
* Stream Music: Stream music files in a loop to connected clients.
* Station Status: Get the current playback status of a station, including the current file, file size, and playback position.
## Technologies Used
* NestJS: A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
* TypeScript: A strongly typed programming language that builds on JavaScript.
* Express: A minimal and flexible Node.js web application framework.
Jest: A delightful JavaScript testing framework with a focus on simplicity.
## Getting Started
### Prerequisites
Ensure you have the following installed:
- Node.js (>= 14.x)
- npm (>= 6.x)
### Installation
1. Clone the repository:
   
```bash
git clone https://github.com/oguzhan18/station-service

cd station-service
```
2. Install dependencies:
```bash
npm install
```
## Running the Application
To start the application in development mode:
```bash
npm run start:dev
````
The application will be accessible at http://localhost:3000.

## API Endpoints
### Create a Station
* <b>Endpoint:</b> POST `/music/create`
* <b>Description:</b> Creates a new radio station and returns the station ID.
* Response:
```json
{
  "id": "station-id"
}
```
### Upload Music
* Endpoint: `POST /music/:stationId/upload`
* Description: Uploads a music file to the specified station.
* Parameters:
  1. stationId (path): The ID of the station.
* Body: Multipart/form-data with the file to be uploaded.
* Response:
```json
{
  "filePath": "path-to-uploaded-file"
}
````
### Stream Music
* Endpoint: `GET /music/:stationId/stream`
* Description: Streams the current music file for the specified station.
* Parameters:
  1. stationId (path): The ID of the station.
* Response: Audio stream.
  
### Get Station Status
* Endpoint: `GET /music/:stationId/status`
* Description: Gets the current status of the station.
* Parameters:
   1. stationId (path): The ID of the station.
* Response:
```json
{
  "currentFile": "current-playing-file",
  "currentFileSize": 123456,
  "currentFilePosition": 60.5
}
```
## Testing
Unit tests are written using Jest. To run the tests:
```bash
npm run test
```
## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch: `git checkout -b` feature/your-feature-name.
3. Make your changes and commit them: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/your-feature-name`.
5. Submit a pull request.






