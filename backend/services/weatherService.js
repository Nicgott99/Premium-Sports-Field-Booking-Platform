const https = require('https');

const DHAKA_LAT  = 23.8103;
const DHAKA_LNG  = 90.4125;
const CACHE_TTL  = 30 * 60 * 1000; // 30 minutes

let cache = { data: null, fetchedAt: 0 };

const OUTDOOR_SPORTS = ['Football', 'Cricket', 'Tennis', 'Volleyball'];

const httpGet = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let raw = '';
    res.on('data', chunk => { raw += chunk; });
    res.on('end', () => {
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
  }).on('error', reject);
});

const fetchCurrent = async (lat = DHAKA_LAT, lng = DHAKA_LNG) => {
  if (Date.now() - cache.fetchedAt < CACHE_TTL && cache.data) return cache.data;

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return buildMockWeather();

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  const raw  = await httpGet(url);

  const result = {
    temp:        Math.round(raw.main.temp),
    feelsLike:   Math.round(raw.main.feels_like),
    humidity:    raw.main.humidity,
    windSpeed:   raw.wind.speed,
    condition:   raw.weather[0].main,
    description: raw.weather[0].description,
    icon:        raw.weather[0].icon,
    visibility:  (raw.visibility ?? 10000) / 1000,
    fetchedAt:   new Date().toISOString(),
  };

  cache = { data: result, fetchedAt: Date.now() };
  return result;
};

const isPlayable = (weather, sport) => {
  const outdoor = OUTDOOR_SPORTS.includes(sport);
  if (!outdoor) return { playable: true, reason: 'Indoor sport — weather not a factor.' };
  if (['Thunderstorm', 'Snow', 'Tornado'].includes(weather.condition)) return { playable: false, reason: `${weather.condition} — unsafe to play outdoors.` };
  if (weather.condition === 'Rain' && weather.windSpeed > 10) return { playable: false, reason: 'Heavy rain and strong winds detected.' };
  if (weather.temp > 40) return { playable: false, reason: 'Extreme heat — risk of heat stroke.' };
  if (weather.temp < 5)  return { playable: false, reason: 'Temperature too low for safe outdoor play.' };
  if (weather.windSpeed > 20) return { playable: false, reason: 'Wind too strong for safe play.' };
  return { playable: true, reason: `Conditions are ${weather.condition === 'Clear' ? 'perfect' : 'acceptable'} for ${sport}.` };
};

const buildMockWeather = () => ({
  temp: 28, feelsLike: 31, humidity: 72, windSpeed: 3.5,
  condition: 'Clouds', description: 'partly cloudy', icon: '02d',
  visibility: 10, fetchedAt: new Date().toISOString(), mock: true,
});

module.exports = { fetchCurrent, isPlayable, buildMockWeather, OUTDOOR_SPORTS };
