/* City search lookup */
const travelEntries = document.getElementsByClassName("entry");
let typingTimer;
const waitTime = 1000;

travelEntries.forEach(travelEntry => {
    const travelImage = travelEntry.getElementsByClassName("trip_image")[0];
    const travelName = travelEntry.getElementsByClassName("trip_name")[0];
    const citySearch = travelEntry.getElementsByClassName("city_search")[0];
    const citySearchInput = travelEntry.getElementsByClassName("city_search_input")[0];
    const weatherForecast = travelEntry.getElementsByClassName("weather_forecast")[0];
    const dateFrom = travelEntry.getElementsByClassName("date_from")[0];
    const dateTo = travelEntry.getElementsByClassName("date_to")[0];
    let suggestionDiv;

    citySearchInput.addEventListener("keyup", () => {
        typingTimer = setTimeout(() => {
            if (citySearchInput.value.length < 3) {
                return;
            }

            getRequest(getApiBaseUrl() + "/city", {
                cityName: citySearchInput.value
            }).then(v => {
                closeAllSuggestions();
                suggestionDiv = document.createElement("div");
                suggestionDiv.classList.add("suggestion_box");
                v.geonames.map(g => {
                    let cityFullName = [g.toponymName, g.countryName].join(",");

                    let cityAnchor = document.createElement("a");
                    cityAnchor.setAttribute("data-city", g.toponymName);
                    cityAnchor.setAttribute("data-name", cityFullName);
                    cityAnchor.setAttribute("data-lng", g.lng);
                    cityAnchor.setAttribute("data-lat", g.lat);
                    cityAnchor.text = cityFullName;

                    cityAnchor.addEventListener("click", applyCity);

                    return cityAnchor;
                }).forEach(a => {
                    suggestionDiv.appendChild(a);
                });

                citySearch.appendChild(suggestionDiv);
            })
        }, waitTime);
    });

    citySearchInput.addEventListener("keydown", () => {
        clearTimeout(typingTimer);
    })

    async function applyCity(evt) {
        let e = evt || window.event;
        let target = e.target || e.srcElement;

        closeAllSuggestions();
        citySearchInput.value = target.getAttribute("data-name");
        travelName.textContent = target.getAttribute("data-city");

        await getRequest(getApiBaseUrl() + "/img", {q: target.getAttribute("data-city")})
            .then(async response => {
                if (response.total === 0) {
                    return await getRequest(getApiBaseUrl() + "/img", {q: "travel"});
                }
                return response;
            }).then(response => {
                travelImage.src = response.hits[Math.floor(Math.random() * response.hits.length)].webformatURL;
                travelImage.alt = target.getAttribute("data-city");
            }).then(() => {
                let startDate = dateFrom.valueAsDate;

                const diffTime = Math.abs(startDate - new Date());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 16) {
                    startDate.setDate(startDate.getDate() + 1);
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    let nextDate = new Date();
                    nextDate.setDate(startDate.getDate() + 1);
                    nextDate.setMonth(startDate.getMonth());
                    nextDate.setFullYear(startDate.getFullYear());

                    getRequest(getApiBaseUrl() + "/weatherHistory", {
                        start_date: startDate.toISOString().split('T')[0],
                        end_date: nextDate.toISOString().split('T')[0],
                        lat: target.getAttribute("data-lat"),
                        lng: target.getAttribute("data-lng")
                    }).then(response => {
                        weatherForecast.innerText = `Typical weather for those days\nMax: ${response.max_temp} - Min: ${response.min_temp}`;
                    })
                } else {
                    getRequest(getApiBaseUrl() + "/weather", {
                        lat: target.getAttribute("data-lat"),
                        lng: target.getAttribute("data-lng")
                    }).then(response => {
                        weatherForecast.innerText = response;
                    })
                }


            });
    }

    function closeAllSuggestions() {
        let allSuggestions = document.getElementsByClassName("suggestion_box");
        allSuggestions.forEach(sBox => {
            sBox.parentNode.removeChild(sBox);
        })
    }

});

async function getRequest(url, params = "") {
    let compiledUrl = new URL(url);
    Object.keys(params).forEach(key => compiledUrl.searchParams.append(key, params[key]));

    let res = await fetch(compiledUrl);
    try {
        return await res.json();
    } catch (error) {
        console.log("error", error);
    }
}

function getApiBaseUrl() {
    if (window.location.hostname === "localhost") {
        return "http://" + [window.location.hostname, window.location.port].join(":")
    }

    return "https://" + [window.location.hostname, window.location.port].join(":");
}
