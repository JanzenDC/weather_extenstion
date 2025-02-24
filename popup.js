document.addEventListener('DOMContentLoaded', () => {
  const API_KEY = 'e5428515f0a75147f92e673610a3b31d';

  function updateDateTime() {
    const now = new Date();
    const options = { 
      weekday: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    };
    return now.toLocaleString('en-US', options).replace(',', '');
  }

  function getWeatherData(lat, lon) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    Promise.all([
      fetch(weatherUrl).then(res => res.json()),
      fetch(forecastUrl).then(res => res.json())
    ])
    .then(([weather, forecast]) => {
      // Update current weather
      document.querySelector('.main-temp').textContent = Math.round(weather.main.temp);
      document.querySelector('.high-low').textContent = 
        `${Math.round(weather.main.temp_max)}° / ${Math.round(weather.main.temp_min)}°F`;
      document.querySelector('.conditions').innerHTML = `
        <div class="condition">Wind: ${Math.round(weather.wind.speed * 3.6)} KMPH</div>
        <div class="condition">Humidity: ${weather.main.humidity}%</div>
      `;
      
      // Update location
      document.querySelector('.location').textContent = weather.name;
      
      // Update time and conditions
      const timeString = updateDateTime();
      const weatherDesc = weather.weather[0].main;
      document.querySelector('div:nth-child(4)').textContent = `${weatherDesc} • ${timeString}`;

      // Update forecast
      const forecastContainer = document.querySelector('.forecast');
      forecastContainer.innerHTML = '';

      const dailyForecasts = forecast.list.reduce((acc, item) => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        
        if (!acc[day]) {
          acc[day] = {
            temps: [],
            icon: item.weather[0].icon
          };
        }
        acc[day].temps.push(item.main.temp);
        return acc;
      }, {});

      Object.entries(dailyForecasts).slice(0, 6).forEach(([day, data]) => {
        const maxTemp = Math.max(...data.temps);
        const minTemp = Math.min(...data.temps);
        
        const dayEl = document.createElement('div');
        dayEl.className = 'forecast-day';
        dayEl.innerHTML = `
          <div class="forecast-date">${day}</div>
          <div class="forecast-icon">${getWeatherEmoji(data.icon)}</div>
          <div class="forecast-temp">${Math.round(maxTemp)}°</div>
          <div class="forecast-temp">${Math.round(minTemp)}°</div>
        `;
        forecastContainer.appendChild(dayEl);
      });
    })
    .catch(error => {
      console.error('Error fetching weather data:', error);
    });
  }

  function getWeatherEmoji(iconCode) {
    const iconMap = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '🌨️', '13n': '🌨️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '☁️';
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        getWeatherData(latitude, longitude);
      },
      error => {
        console.error('Error getting location:', error);
      }
    );
  }

  // Update time every minute
  setInterval(() => {
    const timeString = updateDateTime();
    document.querySelector('div:nth-child(4)').textContent = 
      document.querySelector('div:nth-child(4)').textContent.replace(/•.*$/, `• ${timeString}`);
  }, 60000);
});