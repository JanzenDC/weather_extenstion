document.addEventListener("DOMContentLoaded", () => {
    const API_KEY = "e5428515f0a75147f92e673610a3b31d";
    const timeDateEl = document.getElementById("time-date");
    const weatherEl = document.getElementById("weather");
    const iconEl = document.getElementById("weather-icon");
    const descriptionEl = document.getElementById("description");
    const bodyEl = document.getElementById("body");
    const humidityEl = document.getElementById("humidity");
    const windEl = document.getElementById("wind");
    const locationEl = document.getElementById("location");
    const weatherEffectsEl = document.getElementById("weather-effects");
  
    function updateTime() {
      const now = new Date();
      const options = { 
        weekday: 'long', 
        hour: '2-digit', 
        minute: '2-digit'
      };
      timeDateEl.textContent = now.toLocaleDateString(undefined, options);
    }
    
    function createRainEffect() {
      weatherEffectsEl.innerHTML = '';
      weatherEffectsEl.className = 'rain';
      
      for (let i = 0; i < 100; i++) {
        const drop = document.createElement('div');
        drop.className = 'drop';
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDuration = `${Math.random() * 1 + 0.5}s`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        weatherEffectsEl.appendChild(drop);
      }
    }
  
    function createNightSky() {
      weatherEffectsEl.innerHTML = '';
      const moon = document.createElement('div');
      moon.className = 'moon';
      weatherEffectsEl.appendChild(moon);
    }
  
    function createMorningSun() {
      weatherEffectsEl.innerHTML = '';
      const sun = document.createElement('div');
      sun.className = 'sun';
      weatherEffectsEl.appendChild(sun);
    }
  
    function setBackground(condition, currentHour) {
      let gradientClass = "bg-gradient-to-br";
      weatherEffectsEl.innerHTML = '';
      
      if (condition === "Rain" || condition === "Drizzle" || condition === "Thunderstorm") {
        if (currentHour >= 6 && currentHour < 18) {
          gradientClass += " from-blue-700 via-blue-600 to-blue-800";
        } else {
          gradientClass += " from-gray-900 via-blue-900 to-gray-800";
        }
        createRainEffect();
      } else if (currentHour >= 18 || currentHour < 6) {
        gradientClass += " from-gray-900 via-purple-900 to-gray-800";
        createNightSky();
      } else if (currentHour >= 6 && currentHour < 12) {
        bodyEl.className = "min-h-screen transition-colors duration-700 morning-bg";
        createMorningSun();
        return;
      } else {
        gradientClass += " from-blue-400 via-blue-300 to-blue-500";
        createMorningSun();
      }
      
      bodyEl.className = `min-h-screen transition-colors duration-700 ${gradientClass}`;
    }
  
    function checkEarthquakes(lat, lon) {
      fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson')
        .then(response => response.json())
        .then(data => {
          const nearbyQuakes = data.features.filter(feature => {
            const quakeLat = feature.geometry.coordinates[1];
            const quakeLon = feature.geometry.coordinates[0];
            const distance = getDistanceFromLatLonInKm(lat, lon, quakeLat, quakeLon);
            return distance < 100;
          });
          if (nearbyQuakes.length > 0) {
            descriptionEl.textContent += " ⚠️ Nearby earthquake detected!";
          }
        })
        .catch(err => console.error("Error fetching earthquake data:", err));
    }
  
    function checkTyphoon(lat, lon) {
      fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
          if (data.alerts) {
            const typhoonAlert = data.alerts.find(alert => {
              const event = alert.event.toLowerCase();
              return event.includes("typhoon") || event.includes("tropical storm");
            });
            if (typhoonAlert) {
              descriptionEl.textContent += ` ⚠️ ${typhoonAlert.event} alert: ${typhoonAlert.description.split('.')[0]}.`;
            }
          }
        })
        .catch(err => console.error("Error fetching typhoon data:", err));
    }
  
    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
  
    function deg2rad(deg) {
      return deg * (Math.PI / 180);
    }
  
    function getWeatherData(lat, lon) {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  
      fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
          const cityName = data[0].name;
          const countryCode = data[0].country;
          locationEl.textContent = `📍 ${cityName}, ${countryCode}`;
        })
        .catch(err => {
          console.error("Error fetching location:", err);
          locationEl.textContent = "📍 Location unavailable";
        });
  
      fetch(weatherUrl)
        .then(response => response.json())
        .then(data => {
          const weatherMain = data.weather[0].main;
          const weatherDesc = data.weather[0].description;
          const temp = Math.round(data.main.temp);
          const currentHour = new Date().getHours();
          
          weatherEl.textContent = `${temp}°`;
          iconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
          setBackground(weatherMain, currentHour);
          
          const formattedDesc = weatherDesc
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          descriptionEl.textContent = formattedDesc;
          humidityEl.textContent = `${data.main.humidity}%`;
          windEl.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
  
          if (weatherMain === "Rain" || weatherMain === "Thunderstorm") {
            const rainVolume = data.rain ? (data.rain["1h"] || data.rain["3h"]) : 0;
            if (rainVolume && rainVolume > 5) {
              descriptionEl.textContent = "⚠️ Heavy rain alert: Stay safe!";
            }
          }
  
          checkEarthquakes(lat, lon);
          checkTyphoon(lat, lon);
        })
        .catch(err => {
          console.error(err);
          weatherEl.textContent = "Error";
          descriptionEl.textContent = "Unable to fetch weather data.";
        });
    }
  
    updateTime();
    setInterval(updateTime, 60000);
  
    if (navigator.geolocation) {
      // Ask the user if they want to enable GPS access
      const enableGPS = confirm("Do you want to enable GPS for accurate weather updates?");
      if (enableGPS) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeatherData(lat, lon);
          },
          error => {
            let errorMessage = "Please enable location access.";
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "Location access was denied. Please enable GPS to get weather updates.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Location information is unavailable. Please try again.";
                break;
              case error.TIMEOUT:
                errorMessage = "Location request timed out. Please check your GPS connection.";
                break;
            }
            weatherEl.textContent = "Error";
            descriptionEl.textContent = errorMessage;
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        // User cancelled GPS access
        weatherEl.textContent = "GPS Disabled";
        descriptionEl.textContent = "Location access was cancelled. Enable GPS to view weather updates.";
      }
    } else {
      weatherEl.textContent = "Error";
      descriptionEl.textContent = "Geolocation is not supported by your browser.";
    }
  });
  