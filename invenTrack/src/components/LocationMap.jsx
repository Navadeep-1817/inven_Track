import React, { useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import axios from 'axios';

const mapContainerStyle = { 
    width: '100%', 
    height: '400px',
    borderRadius: '8px'
};

const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // Centered on India

const LocationMap = ({ onLocationSelect }) => {
    const [apiKey, setApiKey] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);

    // Fetch the API key from the backend
    useEffect(() => {
        const fetchApiKey = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/google-maps-key');
                setApiKey(response.data.apiKey);
            } catch (error) {
                console.error("Failed to fetch Google Maps API key", error);
            }
        };
        fetchApiKey();
    }, []);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
    });

    const onMapClick = (event) => {
        const newLocation = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
        };
        setSelectedLocation(newLocation);
        onLocationSelect(newLocation);
    };

    if (loadError) return <div>Error loading maps.</div>;
    if (!isLoaded) return <div>Loading Maps...</div>;

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={5}
            center={defaultCenter}
            onClick={onMapClick}
        >
            {selectedLocation && <Marker position={selectedLocation} />}
        </GoogleMap>
    );
};

export default LocationMap;