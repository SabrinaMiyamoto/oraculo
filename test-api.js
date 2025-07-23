const axios = require('axios'); // Você precisaria instalar 'axios' para isso (npm i axios)

async function testApi() {
    try {
        const response = await axios.get('http://localhost:5000/api/slots/available');
        console.log('Resposta da API:', response.data);
    } catch (error) {
        console.error('Erro ao acessar a API:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados:', error.response.data);
        }
    }
}
testApi();