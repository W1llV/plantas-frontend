const validContinents = {
    "America": [],
    "Africa": [],
    "Asia": [],
    "Europe": [],
    "Oceania": []
};

async function fetchAllPlantIds(page = 1, allIds = []) {
    if (page > 3) return allIds;
    const url = `https://plantas-backend.onrender.com/get-plants?page=${page}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        allIds = allIds.concat(data.data.map(p => p.id));
        if (data.links.next) {
            await new Promise(r => setTimeout(r, 500));
            return fetchAllPlantIds(page + 1, allIds);
        } else return allIds;
    } catch (error) {
        console.error('Error al obtener IDs:', error);
        return allIds;
    }
}

async function fetchPlantDetailsById(ids) {
    const allPlants = [];
    for (const id of ids) {
        try {
            const res = await fetch(`https://plantas-backend.onrender.com/get-plants/${id}`);
            if (!res.ok) throw new Error(`Error ID ${id}: ${res.status}`);
            const plant = await res.json();
            allPlants.push(plant);
            await new Promise(r => setTimeout(r, 100));
        } catch (e) {
            console.error(`Error planta ${id}:`, e);
        }
    }
    return allPlants;
}

function classifyPlantsByContinent(plants) {
    Object.keys(validContinents).forEach(k => validContinents[k] = []);
    plants.forEach(plant => {
        const countries = plant.distribution?.native || [];
        let added = new Set();
        countries.forEach(c => {
            for (const cont of Object.keys(validContinents)) {
                if (!added.has(cont) && isInContinent(c, cont)) {
                    if (!validContinents[cont].some(p => p.id === plant.id)) {
                        validContinents[cont].push(plant);
                        added.add(cont);
                    }
                }
            }
        });
    });
}

function isInContinent(country, cont) {
    const map = {
        America: ["Mexico", "USA", "Canada", "Brazil", "Mexico Central", "Mexico Gulf", "Mexico Northeast", "Mexico Northwest", "Mexico Southeast", "Mexico Southwest"],
        Africa: ["Nigeria", "South Africa", "Egypt", "Algeria", "Morocco", "Tunisia"],
        Asia: ["China", "India", "Japan", "Afghanistan", "Altay", "Amur", "Assam", "East Himalaya", "Inner Mongolia", "Iran", "Iraq", "Kamchatka", "Kazakhstan", "Khabarovsk", "Kirgizstan", "Korea", "Lebanon-Syria", "Magadan", "Manchuria", "Mongolia", "Nepal", "Pakistan", "Primorye", "Qinghai", "Tadzhikistan", "Tibet", "Turkey", "Turkmenistan", "Uzbekistan", "West Himalaya", "West Siberia", "Xinjiang", "Yakutskiya"],
        Europe: ["Germany", "France", "Spain", "Albania", "Austria", "Baltic States", "Belarus", "Belgium", "Bulgaria", "Central European Rus", "Corse", "Czechoslovakia", "Denmark", "East Aegean Is.", "East European Russia", "Finland", "Føroyar", "Great Britain", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kriti", "Krym", "Netherlands", "North Caucasus", "North European Russi", "Northwest European R", "Norway", "Poland", "Portugal", "Romania", "Sardegna", "Sicilia", "South European Russi", "Sweden", "Switzerland", "Transcaucasus", "Turkey-in-Europe", "Ukraine", "Yugoslavia"],
        Oceania: ["Australia", "New Zealand"]
    };
    return map[cont]?.includes(country);
}

function mostrarPorContinente(continent, buttonElement) {
    const resultsDiv = document.getElementById('plants-list');
    resultsDiv.innerHTML = '';
    document.querySelectorAll('#continent-buttons button').forEach(btn => btn.classList.remove('active'));
    if (buttonElement) buttonElement.classList.add('active');

    const plants = validContinents[continent];
    if (!plants?.length) {
        resultsDiv.innerHTML = `<p>No se encontraron plantas en ${continent}.</p>`;
        return;
    }

    plants.forEach(plant => {
        const card = document.createElement('div');
        card.classList.add('plant-card');

        const imageDiv = document.createElement('div');
        imageDiv.classList.add('plant-image');
        const img = document.createElement('img');
        img.src = plant.image_url || 'https://via.placeholder.com/150';
        img.onerror = () => {
            img.src = 'img/imgrota.png';
        };
        imageDiv.appendChild(img);

        const info = document.createElement('div');
        info.classList.add('plant-info');
        info.textContent = plant.common_name || plant.scientific_name;

        card.appendChild(imageDiv);
        card.appendChild(info);
        card.onclick = () => openPlantModal(plant);
        resultsDiv.appendChild(card);
    });
}

async function openPlantModal(plant) {
    document.getElementById('modal-plant-name').textContent = plant.common_name || plant.scientific_name;
    const mainImage = document.getElementById('modal-main-image');
    const query = `${plant.common_name || ''} ${plant.scientific_name || ''}`.trim();
    const url = `https://plantas-backend.onrender.com/get-images?query=${encodeURIComponent(query)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const carousel = document.getElementById('carousel-images');
        carousel.innerHTML = '';

        if (data.results.length > 0) {
            mainImage.src = data.results[0].urls.small;
            mainImage.onerror = () => {
                mainImage.src = 'https://via.placeholder.com/150';
            };
            data.results.forEach(imgData => {
                const thumb = document.createElement('img');
                thumb.src = imgData.urls.thumb;
                thumb.onerror = () => {
                    thumb.src = 'https://via.placeholder.com/150';
                };
                thumb.onclick = () => {
                    mainImage.src = imgData.urls.small;
                };
                carousel.appendChild(thumb);
            });
        }
    } catch (e) {
        console.error('Error al cargar imágenes Unsplash:', e);
    }

    const paises = [...new Set(plant.distribution?.native || [])].slice(0, 3);
    const banderas = paises.map(pais => {
        const code = getCountryCode(pais);
        return code ? `<img src="https://flagcdn.com/24x18/${code.toLowerCase()}.png" alt="${pais}"> ${pais}` : pais;
    });
    document.getElementById('modal-countries').innerHTML = `Países nativos:<br>${banderas.join('<br>') || 'No disponible'}`;

    const syns = plant.synonyms.slice(0, 3).map(s => s.name || s).join(', ') || 'No disponible';
    document.getElementById('modal-synonyms').textContent = `Sinónimos: ${syns}`;
    document.getElementById('modal-scientific-name').textContent = `Nombre científico: ${plant.scientific_name}`;
    document.getElementById('modal-year').textContent = `Año: ${plant.year || 'No disponible'}`;
    document.getElementById('modal-bibliography').textContent = `Bibliografía: ${plant.bibliography || 'No disponible'}`;
    document.getElementById('modal-author').textContent = `Autor: ${plant.author || 'No disponible'}`;
    document.getElementById('modal-status').textContent = `Estado: ${plant.status || 'No disponible'}`;
    document.getElementById('modal-family').textContent = `Familia: ${plant.family}`;
    document.getElementById('modal-genus').textContent = `Género: ${plant.genus || 'No disponible'}`;

    document.getElementById('plantModal').style.display = 'block';
}

function getCountryCode(name) {
    const map = {
        Mexico: 'MX', USA: 'US', Canada: 'CA', Brazil: 'BR',
        Germany: 'DE', France: 'FR', Spain: 'ES', Italy: 'IT', China: 'CN', India: 'IN',
        Japan: 'JP', Australia: 'AU', "New Zealand": 'NZ', Nigeria: 'NG', Egypt: 'EG',
        Morocco: 'MA', Tunisia: 'TN', Afghanistan: 'AF', Albania: 'AL', Austria: 'AT',
        Denmark: 'DK', Greece: 'GR', Iceland: 'IS', Iran: 'IR', Iraq: 'IQ', Lebanon: 'LB',
        Mongolia: 'MN', Nepal: 'NP', Pakistan: 'PK', Portugal: 'PT', Sweden: 'SE',
        Switzerland: 'CH', Turkey: 'TR', Ukraine: 'UA', Uzbekistan: 'UZ'
    };
    return map[name];
}

document.querySelector('.close-btn').onclick = () => {
    document.getElementById('plantModal').style.display = 'none';
};

window.onclick = (e) => {
    const modal = document.getElementById('plantModal');
    if (e.target === modal) modal.style.display = 'none';
};

async function main() {
    const ids = await fetchAllPlantIds();
    const plants = await fetchPlantDetailsById(ids);
    classifyPlantsByContinent(plants);
    const btn = document.querySelector('button[onclick*="America"]');
    mostrarPorContinente('America', btn);
}

main();
