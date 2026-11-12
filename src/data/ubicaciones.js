// Países y sus ciudades principales para los desplegables del registro.
// Si la ciudad del usuario no aparece, puede elegir "Otra ciudad" y escribirla.
export const UBICACIONES = {
  "México": [
    "Acapulco", "Aguascalientes", "Campeche", "Cancún", "Chihuahua", "Chilpancingo", "Ciudad de México",
    "Ciudad Juárez", "Ciudad Obregón", "Ciudad Victoria", "Colima", "Cuautitlán Izcalli", "Cuernavaca",
    "Culiacán", "Durango", "Ecatepec", "Ensenada", "Guadalajara", "Hermosillo", "Irapuato", "La Paz",
    "Lerma", "León", "Los Cabos", "Mazatlán", "Mérida", "Metepec", "Mexicali", "Monterrey", "Morelia",
    "Naucalpan", "Nezahualcóyotl", "Oaxaca", "Pachuca", "Puebla", "Puerto Vallarta", "Querétaro",
    "Reynosa", "Saltillo", "San Luis Potosí", "San Mateo Atenco", "Tampico", "Tepic", "Tijuana",
    "Tlalnepantla", "Tlaxcala", "Toluca", "Torreón", "Tuxtla Gutiérrez", "Veracruz", "Villahermosa",
    "Xalapa", "Zacatecas", "Zapopan", "Zinacantepec",
  ],
  "Argentina": ["Buenos Aires", "Córdoba", "La Plata", "Mar del Plata", "Mendoza", "Rosario", "Salta", "San Miguel de Tucumán", "Santa Fe"],
  "Bolivia": ["Cochabamba", "El Alto", "La Paz", "Oruro", "Santa Cruz de la Sierra", "Sucre", "Tarija"],
  "Brasil": ["Belo Horizonte", "Brasilia", "Curitiba", "Fortaleza", "Porto Alegre", "Recife", "Río de Janeiro", "Salvador", "São Paulo"],
  "Canadá": ["Calgary", "Edmonton", "Montreal", "Ottawa", "Quebec", "Toronto", "Vancouver", "Winnipeg"],
  "Chile": ["Antofagasta", "Concepción", "La Serena", "Puerto Montt", "Rancagua", "Santiago", "Temuco", "Valparaíso", "Viña del Mar"],
  "Colombia": ["Barranquilla", "Bogotá", "Bucaramanga", "Cali", "Cartagena", "Cúcuta", "Manizales", "Medellín", "Pereira", "Santa Marta"],
  "Costa Rica": ["Alajuela", "Cartago", "Heredia", "Liberia", "Limón", "Puntarenas", "San José"],
  "Cuba": ["Camagüey", "Cienfuegos", "Holguín", "La Habana", "Matanzas", "Santa Clara", "Santiago de Cuba"],
  "Ecuador": ["Ambato", "Cuenca", "Guayaquil", "Loja", "Machala", "Manta", "Portoviejo", "Quito"],
  "El Salvador": ["San Miguel", "San Salvador", "Santa Ana", "Santa Tecla", "Soyapango"],
  "España": ["Barcelona", "Bilbao", "Granada", "Madrid", "Málaga", "Murcia", "Palma", "Sevilla", "Valencia", "Zaragoza"],
  "Estados Unidos": ["Austin", "Chicago", "Dallas", "Houston", "Los Ángeles", "Miami", "Nueva York", "Phoenix", "San Antonio", "San Diego", "San Francisco", "Seattle"],
  "Guatemala": ["Antigua Guatemala", "Ciudad de Guatemala", "Escuintla", "Mixco", "Quetzaltenango", "Villa Nueva"],
  "Honduras": ["Choluteca", "Comayagua", "La Ceiba", "San Pedro Sula", "Tegucigalpa"],
  "Nicaragua": ["Chinandega", "Granada", "León", "Managua", "Masaya", "Matagalpa"],
  "Panamá": ["Ciudad de Panamá", "Colón", "David", "La Chorrera", "Santiago de Veraguas"],
  "Paraguay": ["Asunción", "Ciudad del Este", "Encarnación", "Luque", "San Lorenzo"],
  "Perú": ["Arequipa", "Chiclayo", "Cusco", "Huancayo", "Iquitos", "Lima", "Piura", "Trujillo"],
  "Puerto Rico": ["Bayamón", "Caguas", "Carolina", "Mayagüez", "Ponce", "San Juan"],
  "República Dominicana": ["La Romana", "Puerto Plata", "San Pedro de Macorís", "Santiago de los Caballeros", "Santo Domingo"],
  "Uruguay": ["Ciudad de la Costa", "Maldonado", "Montevideo", "Paysandú", "Salto"],
  "Venezuela": ["Barquisimeto", "Caracas", "Ciudad Guayana", "Maracaibo", "Maracay", "Mérida", "Valencia"],
};

// México primero (es el país de la mayoría de los usuarios) y el resto en orden alfabético
export const PAISES = ["México", ...Object.keys(UBICACIONES).filter((p) => p !== "México").sort((a, b) => a.localeCompare(b, "es"))];

export const OTRA = "__otra__";
