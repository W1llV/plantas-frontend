let currentSlideIndex = 0;
const plantIds = []; // Para almacenar los IDs de las plantas
const validDistributions = [
    "Mexico Central",
    "Mexico Gulf",
    "Mexico Northeast",
    "Mexico Northwest",
    "Mexico Southeast",
    "Mexico Southwest"
];

async function fetchPlantIds(page = 1) {
    const url = `https://plantas-backend.onrender.com/get-plants?page=${page}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Almacena los IDs de las plantas
        data.data.forEach(plant => plantIds.push(plant.id));
        
        // Si hay más páginas, llama a la función recursivamente
        if (data.links.next) {
            await fetchPlantIds(page + 1);
        } else {
            // Una vez que se obtienen todos los IDs, llama a la función para obtener detalles
            fetchPlantDetails();
        }
    } catch (error) {
        console.error('Error al obtener los IDs de las plantas:', error);
    }
}

async function fetchPlantDetails() {
    const filteredPlants = [];

    for (const id of plantIds) {
        try {
            const response = await fetch(`https://plantas-backend.onrender.com/get-plants/${id}`);
            const plant = await response.json();
            
            // Filtrar por distribución
            if (plant.distribution && validDistributions.some(dist => plant.distribution.includes(dist))) {
                filteredPlants.push(plant);
            }
        } catch (error) {
            console.error(`Error al obtener detalles de la planta con ID ${id}:`, error);
        }
    }

    displayPlants(filteredPlants);
}

function displayPlants(data) {
    const plantsList = document.getElementById('plants-list');
    plantsList.innerHTML = ''; // Limpiar la lista antes de mostrar nuevas plantas

    if (data.length === 0) {
        const message = document.createElement('p');
        message.textContent = 'No se encontraron plantas en México.';
        plantsList.appendChild(message);
        return;
    }

    data.forEach(plant => {
        const plantCard = document.createElement('div');
        plantCard.classList.add('plant-card');

        const plantImage = document.createElement('div');
        plantImage.classList.add('plant-image');
        
        const img = document.createElement('img');
        img.src = plant.image_url || 'https://via.placeholder.com/150';
        plantImage.appendChild(img);

        const plantInfo = document.createElement('div');
        plantInfo.classList.add('plant-info');
        
        const plantName = document.createElement('h2');
        plantName.textContent = plant.common_name || plant.scientific_name;
        const scientificName = document.createElement('p');
        scientificName.textContent = `Nombre científico: ${plant.scientific_name}`;
        const family = document.createElement('p');
        family.textContent = `Familia: ${plant.family}`;

        plantInfo.appendChild(plantName);
        plantInfo.appendChild(scientificName);
        plantInfo.appendChild(family);

        plantCard.appendChild(plantImage);
        plantCard.appendChild(plantInfo);

        plantCard.addEventListener('click', () => {
            openPlantModal(plant);
        });

        plantsList.appendChild(plantCard);
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

    document.getElementById('modal-scientific-name').textContent = `Nombre científico: ${plant.scientific_name}`;
    document.getElementById('modal-year').textContent = `Año: ${plant.year}`;
    document.getElementById('modal-bibliography').textContent = `Bibliografía: ${plant.bibliography}`;
    document.getElementById('modal-author').textContent = `Autor: ${plant.author}`;
    document.getElementById('modal-status').textContent = `Estado: ${plant.status}`;
    document.getElementById('modal-family').textContent = `Familia: ${plant.family}`;
    document.getElementById('modal-genus').textContent = `Género: ${plant.genus}`;
    document.getElementById('modal-synonyms').textContent = `Sinónimos: ${plant.synonyms.join(', ')}`;

    document.getElementById('plantModal').style.display = 'block';
}

document.querySelector('.close').onclick = () => {
    document.getElementById('plantModal').style.display = 'none';
};

window.onclick = function(event) {
    const modal = document.getElementById('plantModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

fetchData();
