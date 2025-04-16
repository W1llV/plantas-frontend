const validContinents = {
    "America": [],
    "Africa": [],
    "Asia": [],
    "Europe": [],
    "Oceania": []
};

async function fetchAllPlantIds(page = 1, allIds = []) {
    if (page > 10) {
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
            const response = await fetch(`https://plantas-backend.onrender.com/get-plants?${id}`);
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
    validContinents = {
        America: [],
        Africa: [],
        Asia: [],
        Europe: [],
        Oceania: []
    };

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
        'US','CA','MX','BR','AR','CO','CL','PE','VE','GT','CU','BO','DO','HN','PY','NI','SV',
        'CR','PA','UY','JM','HT','BS','BZ','BB','GY','SR','TT','GD','LC','VC','AG','DM','KN'
    ],
    Africa: [
        'NG','EG','ZA','DZ','ET','TZ','KE','UG','MA','GH','AO','CI','CM','SN','ZW','SD','TN','ML',
        'ZM','NE','BF','SS','TD','RW','SO','BJ','BI','LY','CG','LR','MR','SL','GA','GQ','GW','DJ',
        'SZ','LS','GM','ST','KM','CV','ER','SC','RE','YT','SH'
    ],
    Asia: [
        'CN','IN','ID','PK','BD','JP','PH','VN','IR','TR','TH','MM','KR','IQ','AF','SA','UZ','MY',
        'YE','NP','KP','SY','KH','JO','AZ','AE','TJ','IL','LA','KG','LK','OM','SG','PS','KW','GE',
        'MN','AM','QA','BH','TL','BT','MV','BN','KG'
    ],
    Europe: [
        'RU','DE','FR','UK','IT','ES','UA','PL','RO','NL','BE','CZ','GR','PT','SE','HU','BY','AT',
        'CH','BG','DK','FI','SK','NO','IE','HR','LT','SI','LV','EE','LU','MT','IS','AL','CY','ME',
        'MK','MD','BA','SM','MC','LI','VA','AD','XK'
    ],
    Oceania: [
        'AU','NZ','PG','FJ','SB','WS','TO','TV','VU','FM','MH','NR','KI','PW','CK','NU'
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
                plantCard.textContent = plantName;
                plantCard.classList.add('plant-card');

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
                    document.getElementById('modal-distribution').textContent = `Distribución: ${plant.distribution?.native.join(', ') || 'No disponible'}`;
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

