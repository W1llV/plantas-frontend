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

        // Llamada recursiva para la siguiente página
        if (data.links.next) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Esperar medio segundo
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

            await new Promise(resolve => setTimeout(resolve, 100)); // Esperar un poco entre solicitudes
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

        nativeCountries.forEach(country => {
            if (isInContinent(country, "America")) {
                validContinents.America.push(plant);
            } else if (isInContinent(country, "Africa")) {
                validContinents.Africa.push(plant);
            } else if (isInContinent(country, "Asia")) {
                validContinents.Asia.push(plant);
            } else if (isInContinent(country, "Europe")) {
                validContinents.Europe.push(plant);
            } else if (isInContinent(country, "Oceania")) {
                validContinents.Oceania.push(plant);
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
        Africa: [
            "Nigeria", "South Africa", "Egypt", 
            "Algeria", "Morocco", "Tunisia"
        ],
        Asia: [
            "China", "India", "Japan", 
            "Afghanistan", "Altay", "Amur", "Assam", "East Himalaya", "Inner Mongolia", "Iran", 
            "Iraq", "Kamchatka", "Kazakhstan", "Khabarovsk", "Kirgizstan", "Korea", 
            "Lebanon-Syria", "Magadan", "Manchuria", "Mongolia", "Nepal", "Pakistan", 
            "Primorye", "Qinghai", "Tadzhikistan", "Tibet", "Turkey", "Turkmenistan", "Uzbekistan", 
            "West Himalaya", "West Siberia", "Xinjiang", "Yakutskiya"
        ],
        Europe: [
            "Germany", "France", "Spain", 
            "Albania", "Austria", "Baltic States", "Belarus", "Belgium", "Bulgaria", "Central European Rus", 
            "Corse", "Czechoslovakia", "Denmark", "East Aegean Is.", "East European Russia", "Finland", 
            "Føroyar", "Great Britain", "Greece", "Hungary", "Iceland", "Ireland", "Italy", 
            "Kriti", "Krym", "Netherlands", "North Caucasus", "North European Russi", "Northwest European R", 
            "Norway", "Poland", "Portugal", "Romania", "Sardegna", "Sicilia", "South European Russi", 
            "Sweden", "Switzerland", "Transcaucasus", "Turkey-in-Europe", "Ukraine", "Yugoslavia"
        ],
        Oceania: [
            "Australia", "New Zealand"
        ]
    };

    return paisesPorContinente[continent]?.includes(countryCode);
}

function displayResultsByContinent() {
    const resultsDiv = document.getElementById('plants-list');
    resultsDiv.innerHTML = ''; // Limpiar resultados anteriores

    for (const [continent, plants] of Object.entries(validContinents)) {
        const continentSection = document.createElement('div');
        continentSection.innerHTML = `<h3>${continent}</h3>`;
        
        if (plants.length === 0) {
            continentSection.innerHTML += `<p>No se encontraron plantas en ${continent}.</p>`;
        } else {
            plants.forEach(plant => {
                const plantName = plant.common_name || plant.scientific_name;
                const plantCard = document.createElement('div');
                plantCard.classList.add('plant-card');

                const plantImage = document.createElement('div');
                plantImage.classList.add('plant-image');
                const img = document.createElement('img');
                img.src = plant.image_url || 'https://via.placeholder.com/150';
                plantImage.appendChild(img);

                const plantInfo = document.createElement('div');
                plantInfo.classList.add('plant-info');
                plantInfo.textContent = plantName;

                plantCard.appendChild(plantImage);
                plantCard.appendChild(plantInfo);

                // Agregar evento de clic para abrir el modal
                plantCard.onclick = () => {
                    document.getElementById('modal-plant-name').textContent = plantName;
                    document.getElementById('modal-scientific-name').textContent = `Nombre científico: ${plant.scientific_name}`;
                    document.getElementById('modal-family').textContent = `Familia: ${plant.family}`;
                    document.getElementById('modal-genus').textContent = `Género: ${plant.genus || 'No disponible'}`;
                    document.getElementById('modal-synonyms').textContent = `Sinónimos: ${plant.synonyms.join(', ') || 'No disponible'}`;
                    document.getElementById('modal-main-image').src = plant.image_url || 'https://via.placeholder.com/150';
                    document.getElementById('modal-year').textContent = `Año: ${plant.year || 'No disponible'}`;
                    document.getElementById('modal-bibliography').textContent = `Bibliografía: ${plant.bibliography || 'No disponible'}`;
                    document.getElementById('modal-author').textContent = `Autor: ${plant.author || 'No disponible'}`;
                    document.getElementById('modal-status').textContent = `Estado: ${plant.status || 'No disponible'}`;
                    //document.getElementById('modal-distribution').textContent = `Distribución: ${plant.distribution?.native.join(', ') || 'No disponible'}`;
                    document.getElementById('plantModal').style.display = 'block';
                };

                continentSection.appendChild(plantCard);
            });
        }

        resultsDiv.appendChild(continentSection);
    }
}

async function main() {
    const plantIds = await fetchAllPlantIds();
    if (plantIds.length === 0) {
        console.error('No se encontraron IDs de plantas.');
        return;
    }
    const plantDetails = await fetchPlantDetailsById(plantIds);
    classifyPlantsByContinent(plantDetails);
    displayResultsByContinent();
}

// Modal close functionality
document.querySelector('.close').onclick = () => {
    document.getElementById('plantModal').style.display = 'none';
};

window.onclick = function(event) {
    const modal = document.getElementById('plantModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

// Llama a la función principal para iniciar el proceso
main();
