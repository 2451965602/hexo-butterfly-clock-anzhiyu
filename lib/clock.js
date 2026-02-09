function clockUpdateTime(observe, city) {
  let currentColor = '#000'
  if (observe && Array.isArray(observe.weather_color) && observe.weather_color.length > 0) {
    currentColor = observe.weather_color[0]
  }
  var clock_box = document.getElementById('hexo_electric_clock')

  var weatherIconHtml = ''
  if (observe && observe.weather_url) {
    weatherIconHtml = `<img class="card-clock-weather-icon" src="${observe.weather_url}" alt="${observe.weather}">`
  } else if (observe && observe.weather_code) {
    weatherIconHtml = `<i class="qi-${observe.weather_code}-fill" style="color: ${currentColor}"></i>`
  }

  clock_box_html = `
  <div class="clock-row">
    <span id="card-clock-clockdate" class="card-clock-clockdate"></span>
    <span class="card-clock-weather">${weatherIconHtml} ${observe.weather} <span>${observe.degree}</span> ℃</span>
    <span class="card-clock-humidity">💧 ${observe.humidity}%</span>
  </div>
  <div class="clock-row">
    <span id="card-clock-time" class="card-clock-time"></span>
  </div>
  <div class="clock-row">
    <span class="card-clock-windDir"> <i class="qi-gale"></i> ${observe.wind_direction_name || observe.wind_direction}</span>
    <span class="card-clock-location">${city}</span>
    <span id="card-clock-dackorlight" class="card-clock-dackorlight"></span>
  </div>
  `
  var week = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  var card_clock_loading_dom = document.getElementById('card-clock-loading')
  if (card_clock_loading_dom) {
    card_clock_loading_dom.innerHTML = ''
  }
  clock_box.innerHTML = clock_box_html
  function updateTime() {
    var cd = new Date()
    var card_clock_time =
      zeroPadding(cd.getHours(), 2) +
      ':' +
      zeroPadding(cd.getMinutes(), 2) +
      ':' +
      zeroPadding(cd.getSeconds(), 2)
    var card_clock_date =
      zeroPadding(cd.getFullYear(), 4) +
      '-' +
      zeroPadding(cd.getMonth() + 1, 2) +
      '-' +
      zeroPadding(cd.getDate(), 2) +
      ' ' +
      week[cd.getDay()]
    var card_clock_dackorlight = cd.getHours()
    var card_clock_dackorlight_str
    if (card_clock_dackorlight > 12) {
      card_clock_dackorlight -= 12
      card_clock_dackorlight_str = ' P M'
    } else {
      card_clock_dackorlight_str = ' A M'
    }
    if (document.getElementById('card-clock-time')) {
      var card_clock_time_dom = document.getElementById('card-clock-time')
      var card_clock_date_dom = document.getElementById('card-clock-clockdate')
      var card_clock_dackorlight_dom = document.getElementById('card-clock-dackorlight')
      card_clock_time_dom.innerHTML = card_clock_time
      card_clock_date_dom.innerHTML = card_clock_date
      card_clock_dackorlight_dom.innerHTML = card_clock_dackorlight_str
    }
  }
  function zeroPadding(num, digit) {
    var zero = ''
    for (var i = 0; i < digit; i++) {
      zero += '0'
    }
    return (zero + num).slice(-digit)
  }
  var timerID = setInterval(updateTime, 1000)
  updateTime()
}
function getIpInfo() {
  function buildFallbackLocation() {
    var fallbackProvince = typeof clock_default_province === 'string' && clock_default_province
      ? clock_default_province
      : '福建省'
    var fallbackCity = typeof clock_default_city === 'string' && clock_default_city
      ? clock_default_city
      : '福州市'
    var fallbackCounty = typeof clock_default_county === 'string' && clock_default_county
      ? clock_default_county
      : '闽侯县'

    return {
      province: fallbackProvince,
      city: fallbackCity,
      county: fallbackCounty,
      displayCity: fallbackCity
    }
  }

  function parseRegion(region) {
    if (!region || typeof region !== 'string') {
      return {}
    }
    var parts = region.split(/\s+/).filter(Boolean)
    if (parts.length >= 3 && parts[0] === '中国') {
      return { province: parts[1], city: parts[2] }
    }
    if (parts.length >= 2) {
      return { province: parts[0], city: parts[1] }
    }
    if (parts.length === 1) {
      return { province: parts[0], city: '' }
    }
    return {}
  }

  function normalizeLocation(data, fallback) {
    var regionInfo = parseRegion(data && data.region)
    return {
      province: regionInfo.province || fallback.province,
      city: regionInfo.city || fallback.city,
      county: data && data.district ? data.district : fallback.county,
      displayCity: regionInfo.city || fallback.city
    }
  }

  function buildWeatherUrl(location) {
    var params = new URLSearchParams({
      source: 'pc',
      weather_type: 'observe',
      province: location.province,
      city: location.city,
      county: location.county
    })
    return `https://wis.qq.com/weather/common?${params.toString()}`
  }

  function fetchWeatherAndRender(location) {
    return fetch(buildWeatherUrl(location))
      .then(res => res.json())
      .then(data => {
        if (!data || data.status !== 200 || !data.data || !data.data.observe) {
          return
        }
        if (document.getElementById('hexo_electric_clock')) {
          var displayCity = location.displayCity || location.city || location.province
          clockUpdateTime(data.data.observe, displayCity)
        }
      })
  }

  var fallbackLocation = buildFallbackLocation()
  fetch('https://uapis.cn/api/v1/network/myip?source=commercial')
    .then(res => res.json())
    .then(data => fetchWeatherAndRender(normalizeLocation(data, fallbackLocation)))
    .catch(() => fetchWeatherAndRender(fallbackLocation))
}
getIpInfo()