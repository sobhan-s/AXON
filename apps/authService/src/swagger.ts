import swaggerAutogen from 'swagger-autogen';

const outputFile = './swagger_output.json';
const endpointsFiles = ['./routes/auth.routes.ts'];

swaggerAutogen(outputFile, endpointsFiles);
