const API_KEY = '4fc3489696a2985442c614386e25746d'; // Reemplaza esto con tu clave real
const BASE_URL_CURRENT = 'https://api.openweathermap.org/data/2.5/weather';
const BASE_URL_FORECAST = 'https://api.openweathermap.org/data/2.5/forecast';

let typingTimer;  // Variable para el temporizador de escritura
const doneTypingInterval = 500;  // Tiempo en milisegundos (0.5 segundos) después de que el usuario deje de escribir

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
  const searchInput = document.getElementById('city-input');
  const suggestionsList = document.getElementById('suggestions');
  const searchButton = document.getElementById('search-btn');
  const errorMessage = document.getElementById('error-message');
  const weatherSection = document.getElementById('current-weather');

  // Buscar sugerencias mientras el usuario escribe
  searchInput.addEventListener('input', (event) => {
    const query = event.target.value.trim();

    // Limpiar el temporizador anterior
    clearTimeout(typingTimer);

    if (!query) {
      suggestionsList.innerHTML = '';
      suggestionsList.classList.add('hidden');
      return;
    }

    // Esperar a que el usuario termine de escribir antes de hacer la solicitud
    typingTimer = setTimeout(async () => {
      try {
        const suggestions = await fetchCitySuggestions(query);
        displaySuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
      }
    }, doneTypingInterval);
  });

  // Cuando el usuario selecciona una sugerencia
  suggestionsList.addEventListener('click', (event) => {
    if (event.target.tagName === 'LI') {
      searchInput.value = event.target.textContent;
      suggestionsList.innerHTML = '';
      suggestionsList.classList.add('hidden');
    }
  });

  // Botón de búsqueda para obtener el clima de la ciudad seleccionada
  searchButton.addEventListener('click', async () => {
    const city = searchInput.value.trim();

    if (!city) {
      displayError('Please enter a city name.');
      return;
    }

    try {
      const currentWeather = await fetchWeatherData(city, BASE_URL_CURRENT);
      displayCurrentWeather(currentWeather);
      const forecastWeather = await fetchWeatherData(city, BASE_URL_FORECAST);
      displayForecast(forecastWeather);

      errorMessage.textContent = ''; // Limpiar errores previos
    } catch (error) {
      displayError('City not found. Please try again.');
    }
  });
});

// Función genérica para realizar llamadas a la API
async function fetchWeatherData(city, baseUrl) {
  const response = await fetch(`${baseUrl}?q=${city}&appid=${API_KEY}&units=metric`);
  
  const responseData = await response.json();
  console.log('Response Data:', responseData);  // Muestra la respuesta completa de la API

  if (!response.ok || !responseData || responseData.message) {
    throw new Error(responseData.message || 'City not found. Please try again.');
  }

  return responseData;
}

// Función para obtener las sugerencias de ciudades
async function fetchCitySuggestions(query) {
  if (!query || query.length < 3) {
    return [];  // Si la consulta tiene menos de 3 caracteres o está vacía, no hacemos la solicitud
  }

  const url = `https://api.openweathermap.org/data/2.5/find?q=${query}&appid=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log('City Suggestions:', data);  // Verifica la estructura de los datos

    if (!response.ok || !data.list || data.list.length === 0) {
      throw new Error('No cities found. Please try a different search.');
    }

    return data.list;  // Retornamos las sugerencias de ciudades
  } catch (error) {
    console.error('Error fetching city suggestions:', error);
    return [];
  }
}

// Mostrar las sugerencias de ciudades
function displaySuggestions(suggestions) {
  const suggestionsList = document.getElementById('suggestions');
  suggestionsList.innerHTML = ''; // Limpiar sugerencias anteriores

  if (suggestions.length === 0) {
    suggestionsList.classList.add('hidden');
    return;
  }

  suggestions.forEach(suggestion => {
    const listItem = document.createElement('li');
    listItem.textContent = `${suggestion.name}, ${suggestion.sys.country}`; // Mostrar ciudad y país
    suggestionsList.appendChild(listItem);
  });

  suggestionsList.classList.remove('hidden');
}

// Mostrar el clima actual
function displayCurrentWeather(data) {
    const weatherIcon = document.getElementById('weather-icon');
    const temperature = document.getElementById('temperature');
    const description = document.getElementById('description');
    const location = document.getElementById('location');
    const weatherSection = document.getElementById('current-weather');
    const localTimeElement = document.getElementById('local-time'); // Elemento para mostrar la hora local
  
    weatherSection.classList.remove('hidden');
  
    // Establecer los datos del clima
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
    temperature.textContent = `${Math.round(data.main.temp)} °C`;
    description.textContent = data.weather[0].description;
    location.textContent = `${data.name}, ${data.sys.country}`;
  
    // Calcular la hora local usando la zona horaria (en segundos)
    const localTime = new Date((data.dt + data.timezone) * 1000);
    const hours = localTime.getHours().toString().padStart(2, '0');
    const minutes = localTime.getMinutes().toString().padStart(2, '0');
    const seconds = localTime.getSeconds().toString().padStart(2, '0');
    const localTimeString = `${hours}:${minutes}:${seconds}`;
  
    // Mostrar la hora local
    localTimeElement.textContent = `Local Time: ${localTimeString}`;
  }

// Mostrar el pronóstico a 5 días
function displayForecast(data) {
  const forecastSection = document.getElementById('forecast');
  const forecastContainer = document.getElementById('forecast-container');
  forecastContainer.innerHTML = '';  // Limpiar contenido previo

  const dailyData = data.list.filter((entry) => entry.dt_txt.includes('12:00:00'));

  dailyData.forEach((day) => {
    const card = document.createElement('div');
    card.classList.add('forecast-card');

    card.innerHTML = `
      <p>${new Date(day.dt * 1000).toLocaleDateString()}</p>
      <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}">
      <p>${Math.round(day.main.temp_min)}°C / ${Math.round(day.main.temp_max)}°C</p>
      <p>${day.weather[0].description}</p>
    `;

    forecastContainer.appendChild(card);
  });

  forecastSection.classList.remove('hidden');
}

// Mostrar errores
function displayError(message) {
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = message;
}
