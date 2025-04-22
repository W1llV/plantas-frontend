const validContinents = {
    "America": [],
    "Africa": [],
    "Asia": [],
    "Europe": [],
    "Oceania": []
};

async function fetchAllPlantIds(page = 1, allIds = []) {
    if (page > 3) {
        return allIds;
    }

    const url = `https://plantas-backend.onrender.com/get-plants?page=${page}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status}`);
        }
        const data = await response.json();
        allIds = allIds.concat(data.data.map(plant => plant.id));

        if (data.links.next) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return fetchAllPlantIds(page + 1, allIds);
        } else {
            return allIds;
        }
    } catch (error) {
        console.error('Error al obtener los IDs de las plantas:', error);
        return allIds;
    }
}

async function fetchPlantDetailsById(ids) {
    const allPlants = [];

    for (const id of ids) {
        try {
            const response = await fetch(`https://plantas-backend.onrender.com/get-plants/${id}`);
            if (!response.ok) {
                throw new Error(`Error en la solicitud para ID ${id}: ${response.status}`);
            }
            const plant = await response.json();
            allPlants.push(plant);

            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error(`Error al obtener detalles de la planta con ID ${id}:`, error);
        }
    }

    return allPlants;
}

function classifyPlantsByContinent(plants) {
    validContinents.America = [];
    validContinents.Africa = [];
    validContinents.Asia = [];
    validContinents.Europe = [];
    validContinents.Oceania = [];

    plants.forEach(plant => {
        const nativeCountries = plant.distribution?.native || [];
        let addedToContinent = new Set();

        nativeCountries.forEach(country => {
            for (const continent of Object.keys(validContinents)) {
                if (!addedToContinent.has(continent) && isInContinent(country, continent)) {
                    if (!validContinents[continent].some(p => p.id === plant.id)) {
                        validContinents[continent].push(plant);
                        addedToContinent.add(continent);
                    }
                }
            }
        });
    });

    return validContinents;
}

function isInContinent(countryCode, continent) {
    const paisesPorContinente = {
        America: [
            "Mexico", "USA", "Canada", "Brazil",
            "Mexico Central", "Mexico Gulf", "Mexico Northeast", "Mexico Northwest",
            "Mexico Southeast", "Mexico Southwest"
        ],
        Africa: ["Nigeria", "South Africa", "Egypt", "Algeria", "Morocco", "Tunisia"],
        Asia: [
            "China", "India", "Japan", "Afghanistan", "Altay", "Amur", "Assam", "East Himalaya", "Inner Mongolia", "Iran", 
            "Iraq", "Kamchatka", "Kazakhstan", "Khabarovsk", "Kirgizstan", "Korea", "Lebanon-Syria", "Magadan", "Manchuria", 
            "Mongolia", "Nepal", "Pakistan", "Primorye", "Qinghai", "Tadzhikistan", "Tibet", "Turkey", "Turkmenistan", 
            "Uzbekistan", "West Himalaya", "West Siberia", "Xinjiang", "Yakutskiya"
        ],
        Europe: [
            "Germany", "France", "Spain", "Albania", "Austria", "Baltic States", "Belarus", "Belgium", "Bulgaria", 
            "Central European Rus", "Corse", "Czechoslovakia", "Denmark", "East Aegean Is.", "East European Russia", 
            "Finland", "Føroyar", "Great Britain", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kriti", "Krym", 
            "Netherlands", "North Caucasus", "North European Russi", "Northwest European R", "Norway", "Poland", "Portugal", 
            "Romania", "Sardegna", "Sicilia", "South European Russi", "Sweden", "Switzerland", "Transcaucasus", 
            "Turkey-in-Europe", "Ukraine", "Yugoslavia"
        ],
        Oceania: ["Australia", "New Zealand"]
    };

    return paisesPorContinente[continent]?.includes(countryCode);
}

function mostrarPorContinente(continent, buttonElement) {
    const resultsDiv = document.getElementById('plants-list');
    resultsDiv.innerHTML = '';

    const allButtons = document.querySelectorAll('#continent-buttons button');
    allButtons.forEach(btn => btn.classList.remove('active'));
    if (buttonElement) {
        buttonElement.classList.add('active');
    }

    const plants = validContinents[continent];
    if (!plants || plants.length === 0) {
        resultsDiv.innerHTML = `<p>No se encontraron plantas en ${continent}.</p>`;
        return;
    }

    plants.forEach(plant => {
        const plantCard = document.createElement('div');
        plantCard.classList.add('plant-card');

        const plantImage = document.createElement('div');
        plantImage.classList.add('plant-image');
        const img = document.createElement('img');
        img.src = plant.image_url || 'https://via.placeholder.com/150';
        plantImage.appendChild(img);

        const plantInfo = document.createElement('div');
        plantInfo.classList.add('plant-info');
        plantInfo.textContent = plant.common_name || plant.scientific_name;

        plantCard.appendChild(plantImage);
        plantCard.appendChild(plantInfo);

        plantCard.onclick = () => {
            openPlantModal(plant);
        };

        resultsDiv.appendChild(plantCard);
    });
}

async function openPlantModal(plant) {
    document.getElementById('modal-plant-name').textContent = plant.common_name || plant.scientific_name;
    const mainImage = document.getElementById('modal-main-image');
    const query = `${plant.common_name || ''} ${plant.scientific_name || ''}`.trim();
    const unsplashApiUrl = `https://plantas-backend.onrender.com/get-images?query=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(unsplashApiUrl);
        const data = await response.json();
        const carouselImagesDiv = document.getElementById('carousel-images');
        carouselImagesDiv.innerHTML = '';

        if (data.results.length > 0) {
            mainImage.src = data.results[0].urls.small;
            data.results.forEach(image => {
                const img = document.createElement('img');
                img.src = image.urls.thumb;
                img.addEventListener('click', () => {
                    mainImage.src = image.urls.small;
                });
                carouselImagesDiv.appendChild(img);
            });
        }
    } catch (error) {
        console.error('Error al obtener imágenes de Unsplash:', error);
    }

    const paisesOriginales = plant.distribution?.native || [];
    const paisesUnicos = [...new Set(paisesOriginales)].slice(0, 3);

    const paisesConBanderas = paisesUnicos.map(pais => {
        const code = getCountryCode(pais);
        return code
            ? `<img src="https://flagcdn.com/24x18/${code.toLowerCase()}.png" alt="${pais}" title="${pais}" style="margin-right: 6px;">${pais}`
            : pais;
    });

    document.getElementById('modal-countries').innerHTML = `Países nativos:<br>${paisesConBanderas.join('<br>') || 'No disponible'}`;

    const maxSynonyms = plant.synonyms.slice(0, 3);
    const synonymsText = maxSynonyms.map(syn => syn.name || syn).join(', ') || 'No disponible';
    document.getElementById('modal-synonyms').textContent = `Sinónimos: ${synonymsText}`;

    document.getElementById('modal-scientific-name').textContent = `Nombre científico: ${plant.scientific_name}`;
    document.getElementById('modal-year').textContent = `Año: ${plant.year || 'No disponible'}`;
    document.getElementById('modal-bibliography').textContent = `Bibliografía: ${plant.bibliography || 'No disponible'}`;
    document.getElementById('modal-author').textContent = `Autor: ${plant.author || 'No disponible'}`;
    document.getElementById('modal-status').textContent = `Estado: ${plant.status || 'No disponible'}`;
    document.getElementById('modal-family').textContent = `Familia: ${plant.family}`;
    document.getElementById('modal-genus').textContent = `Género: ${plant.genus || 'No disponible'}`;

    document.getElementById('plantModal').style.display = 'block';
}

function getCountryCode(countryName) {
    const countryCodes = {
        Afghanistan: 'AF',
        Albania: 'AL',
        Algeria: 'DZ',
        Andorra: 'AD',
        Angola: 'AO',
        AntiguaAndBarbuda: 'AG',
        Argentina: 'AR',
        Armenia: 'AM',
        Australia: 'AU',
        Austria: 'AT',
        Azerbaijan: 'AZ',
        Bahamas: 'BS',
        Bahrain: 'BH',
        Bangladesh: 'BD',
        Barbados: 'BB',
        Belarus: 'BY',
        Belgium: 'BE',
        Belize: 'BZ',
        Benin: 'BJ',
        Bhutan: 'BT',
        Bolivia: 'BO',
        BosniaAndHerzegovina: 'BA',
        Botswana: 'BW',
        Brazil: 'BR',
        Brunei: 'BN',
        Bulgaria: 'BG',
        BurkinaFaso: 'BF',
        Burundi: 'BI',
        Cambodia: 'KH',
        Cameroon: 'CM',
        Canada: 'CA',
        CapeVerde: 'CV',
        CentralAfricanRepublic: 'CF',
        Chad: 'TD',
        Chile: 'CL',
        China: 'CN',
        Colombia: 'CO',
        Comoros: 'KM',
        Congo: 'CG',
        CostaRica: 'CR',
        Croatia: 'HR',
        Cuba: 'CU',
        Cyprus: 'CY',
        CzechRepublic: 'CZ',
        Denmark: 'DK',
        Djibouti: 'DJ',
        Dominica: 'DM',
        DominicanRepublic: 'DO',
        Ecuador: 'EC',
        Egypt: 'EG',
        ElSalvador: 'SV',
        EquatorialGuinea: 'GQ',
        Eritrea: 'ER',
        Estonia: 'EE',
        Eswatini: 'SZ',
        Ethiopia: 'ET',
        Fiji: 'FJ',
        Finland: 'FI',
        France: 'FR',
        Gabon: 'GA',
        Gambia: 'GM',
        Georgia: 'GE',
        Germany: 'DE',
        Ghana: 'GH',
        Greece: 'GR',
        Grenada: 'GD',
        Guatemala: 'GT',
        Guinea: 'GN',
        GuineaBissau: 'GW',
        Guyana: 'GY',
        Haiti: 'HT',
        Honduras: 'HN',
        Hungary: 'HU',
        Iceland: 'IS',
        India: 'IN',
        Indonesia: 'ID',
        Iran: 'IR',
        Iraq: 'IQ',
        Ireland: 'IE',
        Israel: 'IL',
        Italy: 'IT',
        IvoryCoast: 'CI',
        Jamaica: 'JM',
        Japan: 'JP',
        Jordan: 'JO',
        Kazakhstan: 'KZ',
        Kenya: 'KE',
        Kiribati: 'KI',
        Kosovo: 'XK',
        Kuwait: 'KW',
        Kyrgyzstan: 'KG',
        Laos: 'LA',
        Latvia: 'LV',
        Lebanon: 'LB',
        Lesotho: 'LS',
        Liberia: 'LR',
        Libya: 'LY',
        Liechtenstein: 'LI',
        Lithuania: 'LT',
        Luxembourg: 'LU',
        Madagascar: 'MG',
        Malawi: 'MW',
        Malaysia: 'MY',
        Maldives: 'MV',
        Mali: 'ML',
        Malta: 'MT',
        MarshallIslands: 'MH',
        Mauritania: 'MR',
        Mauritius: 'MU',
        Mexico: 'MX',
        Micronesia: 'FM',
        Moldova: 'MD',
        Monaco: 'MC',
        Mongolia: 'MN',
        Montenegro: 'ME',
        Morocco: 'MA',
        Mozambique: 'MZ',
        Myanmar: 'MM',
        Namibia: 'NA',
        Nauru: 'NR',
        Nepal: 'NP',
        Netherlands: 'NL',
        NewZealand: 'NZ',
        Nicaragua: 'NI',
        Niger: 'NE',
        Nigeria: 'NG',
        NorthKorea: 'KP',
        NorthMacedonia: 'MK',
        Norway: 'NO',
        Oman: 'OM',
        Pakistan: 'PK',
        Palau: 'PW',
        Panama: 'PA',
        PapuaNewGuinea: 'PG',
        Paraguay: 'PY',
        Peru: 'PE',
        Philippines: 'PH',
        Poland: 'PL',
        Portugal: 'PT',
        Qatar: 'QA',
        Romania: 'RO',
        Russia: 'RU',
        Rwanda: 'RW',
        SaintKittsAndNevis: 'KN',
        SaintLucia: 'LC',
        SaintVincentAndGrenadines: 'VC',
        Samoa: 'WS',
        SanMarino: 'SM',
        SaoTomeAndPrincipe: 'ST',
        SaudiArabia: 'SA',
        Senegal: 'SN',
        Serbia: 'RS',
        Seychelles: 'SC',
        SierraLeone: 'SL',
        Singapore: 'SG',
        Slovakia: 'SK',
        Slovenia: 'SI',
        SolomonIslands: 'SB',
        Somalia: 'SO',
        SouthAfrica: 'ZA',
        SouthKorea: 'KR',
        SouthSudan: 'SS',
        Spain: 'ES',
        SriLanka: 'LK',
        Sudan: 'SD',
        Suriname: 'SR',
        Sweden: 'SE',
        Switzerland: 'CH',
        Syria: 'SY',
        Tajikistan: 'TJ',
        Tanzania: 'TZ',
        Thailand: 'TH',
        TimorLeste: 'TL',
        Togo: 'TG',
        Tonga: 'TO',
        TrinidadAndTobago: 'TT',
        Tunisia: 'TN',
        Turkey: 'TR',
        Turkmenistan: 'TM',
        Tuvalu: 'TV',
        Uganda: 'UG',
        Ukraine: 'UA',
        UnitedArabEmirates: 'AE',
        UnitedKingdom: 'GB',
        Uruguay: 'UY',
        USA: 'US',
        Uzbekistan: 'UZ',
        Vanuatu: 'VU',
        VaticanCity: 'VA',
        Venezuela: 'VE',
        Vietnam: 'VN',
        Yemen: 'YE',
        Zambia: 'ZM',
        Zimbabwe: 'ZW',
    };
    return countryCodes[countryName] || null;
}

async function main() {
    const plantIds = await fetchAllPlantIds();
    if (plantIds.length === 0) {
        console.error('No se encontraron IDs de plantas.');
        return;
    }
    const plantDetails = await fetchPlantDetailsById(plantIds);
    classifyPlantsByContinent(plantDetails);

    const americaBtn = document.querySelector('button[onclick*="America"]');
    mostrarPorContinente('America', americaBtn);
}

document.querySelector('.close-btn').onclick = () => {
    document.getElementById('plantModal').style.display = 'none';
};

window.onclick = function(event) {
    const modal = document.getElementById('plantModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

main();
