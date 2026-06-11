export const ESTADOS_Y_CIUDADES: Record<string, string[]> = {
  'Aguascalientes': ['Aguascalientes'],
  'Baja California': ['Tijuana', 'Mexicali', 'Ensenada', 'Rosarito'],
  'Baja California Sur': ['La Paz', 'Los Cabos', 'Loreto'],
  'Campeche': ['Campeche', 'Ciudad del Carmen'],
  'Chiapas': ['Tuxtla Gutiérrez', 'San Cristóbal de las Casas', 'Tapachula', 'Comitán'],
  'Chihuahua': ['Chihuahua', 'Ciudad Juárez', 'Delicias', 'Cuauhtémoc'],
  'Ciudad de México': ['Álvaro Obregón', 'Azcapotzalco', 'Benito Juárez', 'Coyoacán', 'Cuajimalpa', 'Cuauhtémoc', 'Gustavo A. Madero', 'Iztacalco', 'Iztapalapa', 'Magdalena Contreras', 'Miguel Hidalgo', 'Milpa Alta', 'Tláhuac', 'Tlalpan', 'Venustiano Carranza', 'Xochimilco'],
  'Coahuila': ['Saltillo', 'Torreón', 'Monclova', 'Piedras Negras', 'Acuña'],
  'Colima': ['Colima', 'Manzanillo', 'Tecomán'],
  'Durango': ['Durango', 'Gómez Palacio'],
  'Estado de México': ['Ecatepec', 'Naucalpan', 'Toluca', 'Nezahualcóyotl', 'Tlalnepantla', 'Chimalhuacán', 'Texcoco', 'Cuautitlán Izcalli', 'Metepec'],
  'Guanajuato': ['León', 'Irapuato', 'Celaya', 'Salamanca', 'Guanajuato', 'Silao', 'San Miguel de Allende', 'Pénjamo', 'Acámbaro', 'Valle de Santiago'],
  'Guerrero': ['Acapulco', 'Chilpancingo', 'Iguala', 'Zihuatanejo'],
  'Hidalgo': ['Pachuca', 'Tulancingo', 'Tula de Allende'],
  'Jalisco': ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá', 'Puerto Vallarta', 'Lagos de Moreno', 'Tepatitlán'],
  'Michoacán': ['Morelia', 'Uruapan', 'Lázaro Cárdenas', 'Zamora', 'Apatzingán'],
  'Morelos': ['Cuernavaca', 'Cuautla', 'Jiutepec', 'Temixco'],
  'Nayarit': ['Tepic', 'Bahía de Banderas', 'Santiago Ixcuintla'],
  'Nuevo León': ['Monterrey', 'San Nicolás de los Garza', 'Guadalupe', 'Apodaca', 'San Pedro Garza García', 'Santa Catarina', 'General Escobedo'],
  'Oaxaca': ['Oaxaca de Juárez', 'Salina Cruz', 'Juchitán', 'Tuxtepec'],
  'Puebla': ['Puebla', 'Tehuacán', 'San Andrés Cholula', 'Atlixco'],
  'Querétaro': ['Querétaro', 'San Juan del Río', 'Corregidora', 'El Marqués'],
  'Quintana Roo': ['Cancún', 'Playa del Carmen', 'Cozumel', 'Chetumal', 'Tulum'],
  'San Luis Potosí': ['San Luis Potosí', 'Soledad de Graciano Sánchez', 'Ciudad Valles', 'Matehuala'],
  'Sinaloa': ['Culiacán', 'Mazatlán', 'Los Mochis', 'Guasave'],
  'Sonora': ['Hermosillo', 'Ciudad Obregón', 'Nogales', 'San Luis Río Colorado', 'Guaymas'],
  'Tabasco': ['Villahermosa', 'Cárdenas', 'Comalcalco'],
  'Tamaulipas': ['Tampico', 'Reynosa', 'Matamoros', 'Nuevo Laredo', 'Victoria'],
  'Tlaxcala': ['Tlaxcala', 'Apizaco', 'Huamantla'],
  'Veracruz': ['Veracruz', 'Xalapa', 'Coatzacoalcos', 'Córdoba', 'Orizaba', 'Poza Rica'],
  'Yucatán': ['Mérida', 'Valladolid', 'Progreso', 'Tizimín'],
  'Zacatecas': ['Zacatecas', 'Fresnillo', 'Guadalupe'],
};

export const ESTADOS = Object.keys(ESTADOS_Y_CIUDADES).sort();

export function getCiudades(estado: string): string[] {
  return ESTADOS_Y_CIUDADES[estado] || [];
}

export function formatearUbicacion(estado: string, ciudad: string): string {
  return ciudad + ', ' + estado;
}