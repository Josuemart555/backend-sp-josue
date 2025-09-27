const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.1.0',
        info: {
            title: 'API de Cartelera',
            version: '1.0.0',
            description: 'API para gestionar Cartelera'
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Desarrollo' }
        ],
        components: {
            schemas: {
                // Schemas para Cartelera
                CarteleraItem: {
                    type: 'object',
                    required: ['imdbID', 'Title', 'Year', 'Type', 'Estado', 'description', 'Ubication', 'Poster'],
                    properties: {
                        imdbID: { type: 'string', example: '80000' },
                        Title: { type: 'string', example: 'Titanes del Atlantico' },
                        Year: { type: 'integer', example: 2013 },
                        Type: { type: 'string', example: 'Ciencia Ficcion' },
                        Poster: { type: 'string', format: 'uri', example: 'https://demo/demoimages.png' },
                        Estado: { type: 'boolean', example: true },
                        description: { type: 'string', example: 'La humanidad se transforma en robots gigantes para defender la costa este de los monstruos que surgen del fondo del mar.' },
                        Ubication: { type: 'string', example: 'POPCINEMA' }
                    },
                    additionalProperties: false
                },
                CarteleraCreateRequest: {
                    allOf: [{ $ref: '#/components/schemas/CarteleraItem' }]
                },
                ApiRespuesta: {
                    type: 'object',
                    properties: {
                        codError: { type: 'string', enum: ['200', '400', '500'] },
                        msgRespuesta: { type: 'string' }
                    },
                    example: { codError: '200', msgRespuesta: 'Registro Insertado' }
                }
            }
        },
        paths: {
            '/api/cartelera': {
                post: {
                    tags: ['Cartelera'],
                    summary: 'Crear registro de cartelera',
                    description: 'Inserta una película/elemento en la tabla Cartelera.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CarteleraCreateRequest' },
                                example: {
                                    imdbID: '80000',
                                    Title: 'Titanes del Atlantico',
                                    Year: 2013,
                                    Type: 'Ciencia Ficcion',
                                    Poster: 'https://demo/demoimages.png',
                                    Estado: true,
                                    description: 'La humanidad se transforma en robots gigantes para defender la costa este de los monstruos que surgen del fondo del mar.',
                                    Ubication: 'POPCINEMA'
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Registro insertado correctamente',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiRespuesta' },
                                    example: { codError: '200', msgRespuesta: 'Registro Insertado' }
                                }
                            }
                        },
                        400: {
                            description: 'Error de solicitud o datos inválidos (Bad Request)',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiRespuesta' },
                                    example: { codError: '400', msgRespuesta: 'Datos inválidos: <detalle>' }
                                }
                            }
                        },
                        500: {
                            description: 'Error interno del servidor',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiRespuesta' },
                                    example: { codError: '500', msgRespuesta: 'Error interno del servidor' }
                                }
                            }
                        }
                    }
                }
            }
        }

    },
    apis: [] // Si más adelante agregas anotaciones JSDoc en rutas, agrega aquí patrones de archivos
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;