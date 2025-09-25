const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.1.0',
        info: {
            title: 'API de Libros',
            version: '1.0.0',
            description: 'API para gestionar libros'
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Desarrollo' }
        ],
        components: {
            schemas: {
                Libro: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        titulo: { type: 'string' },
                        autor: { type: 'string' },
                        anio: { type: 'integer', nullable: true },
                        disponible: { type: 'boolean' },
                    }
                },
                LibroCreateRequest: {
                    type: 'object',
                    required: ['titulo', 'autor'],
                    properties: {
                        titulo: { type: 'string' },
                        autor: { type: 'string' },
                        anio: { type: 'integer', nullable: true },
                        disponible: { type: 'boolean' },
                    },
                    additionalProperties: false
                },
                LibroUpdateRequest: {
                    type: 'object',
                    properties: {
                        titulo: { type: 'string' },
                        autor: { type: 'string' },
                        anio: { type: 'integer', nullable: true },
                        disponible: { type: 'boolean' },
                    },
                    additionalProperties: false
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        details: { type: 'object', additionalProperties: true }
                    }
                }
            }
        },
        paths: {
            '/api/libros': {
                get: {
                    tags: ['Libros'],
                    summary: 'Listar libros',
                    responses: {
                        200: {
                            description: 'Listado de libros',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Libro' }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['Libros'],
                    summary: 'Crear libro',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/LibroCreateRequest' } }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Libro creado',
                            content: {
                                'application/json': { schema: { $ref: '#/components/schemas/Libro' } }
                            }
                        },
                        400: { description: 'Datos inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            '/api/libros/{id}': {
                get: {
                    tags: ['Libros'],
                    summary: 'Obtener libro por ID',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    responses: {
                        200: {
                            description: 'Libro encontrado',
                            content: {
                                'application/json': { schema: { $ref: '#/components/schemas/Libro' } }
                            }
                        },
                        404: { description: 'No encontrado' }
                    }
                },
                put: {
                    tags: ['Libros'],
                    summary: 'Actualizar libro',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/LibroUpdateRequest' } }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Libro actualizado',
                            content: {
                                'application/json': { schema: { $ref: '#/components/schemas/Libro' } }
                            }
                        },
                        400: { description: 'Datos inválidos' },
                        404: { description: 'No encontrado' }
                    }
                },
                delete: {
                    tags: ['Libros'],
                    summary: 'Eliminar libro',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    responses: {
                        204: { description: 'Eliminado' },
                        404: { description: 'No encontrado' }
                    }
                }
            }
        }

    },
    apis: [] // Si más adelante agregas anotaciones JSDoc en rutas, agrega aquí patrones de archivos
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;