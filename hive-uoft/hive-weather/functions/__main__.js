const weather = require('weather-js');
const { promisify } = require('util');

const findWeather = promisify(weather.find);
/**
 * A basic Hello World function
 * @param {string} search The location you want the weather for
 * @returns {object}
 */
module.exports = async (search = 'Toronto, ON', context) => {
  let weather = await findWeather({ search });
  weather = weather[0];
  return {
    temperature: globalTemperature(+weather.current.temperature),
    feelsLike: globalTemperature(+weather.current.feelslike),
    forecast: weather.forecast.map(day => ({
      low: globalTemperature(+day.low),
      hight: globalTemperature(+day.high),
      description: day.skytestday,
      date: day.date,
      day: day.day,
    })),
  };
};

function globalTemperature(fahrenheight) {
  // cast it to a number, just in case :)
  const f = Math.floor(+fahrenheight);
  const c = Math.floor((f - 32) * 5 / 9);
  const k = Math.floor(c + 273.15);
  return {
    f,
    c,
    k,
  };
}
