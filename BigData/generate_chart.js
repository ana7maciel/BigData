import fs from 'fs';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import csvParser from 'csv-parser';

//função para carregar e processar os dados do CSV
async function loadChartData() {
  //objeto para armazenar as notas totais e contagem por gênero
  const genreRatings = {};

  return new Promise((resolve, reject) => {
    //lê o arquivo CSV linha por linha
    fs.createReadStream('filmes.csv')
      .pipe(csvParser({ separator: ',' })) //usa o csv-parser para processar o CSV
      .on('data', (row) => {
        //remover espaços extras das chaves do objeto
        const cleanedRow = {};
        Object.keys(row).forEach(key => {
          cleanedRow[key.trim()] = row[key].trim();
        });

        //divide os gêneros (caso existam múltiplos) e converte a nota para número
        const genres = cleanedRow['Gênero'].split(',').map(genre => genre.trim());
        const rating = parseFloat(cleanedRow['Nota']);

        //verifica se a nota é um número válido
        if (isNaN(rating)) {
          //se a nota não for um número válido, loga um erro e ignora essa linha
          console.error(`Nota inválida encontrada na linha: ${JSON.stringify(cleanedRow)}`);
          return; //vai para a próxima iteração
        }

        //itera sobre cada gênero para adicionar a nota ao total e incrementar a contagem
        genres.forEach(genre => {
          //se o gênero ainda não existe no objeto, inicializa com totalRating e count
          if (!genreRatings[genre]) {
            genreRatings[genre] = { totalRating: 0, count: 0 };
          }
          //adiciona a nota ao total de notas do gênero e incrementa a contagem
          genreRatings[genre].totalRating += rating;
          genreRatings[genre].count += 1;
        });
      })
      .on('end', () => {
        //log para verificar todos os gêneros capturados e suas médias
        console.log("Gêneros capturados e suas médias:", genreRatings);

        //converte os dados de notas totais e contagem em médias por gênero
        const data = Object.keys(genreRatings).map(genre => ({
          genre,
          averageRating: genreRatings[genre].totalRating / genreRatings[genre].count
        }));

        //resolve a promessa com os dados prontos para gerar o gráfico
        resolve(data);
      })
      .on('error', (error) => reject(error)); //rejeita a promessa em caso de erro na leitura do CSV
  });
}

//função para gerar o gráfico e salvar como PNG
async function generateChart() {
  //carrega os dados processados do CSV
  const chartData = await loadChartData();
  const width = 800; //largura do gráfico
  const height = 600; //altura do gráfico

  //inicializa o ChartJSNodeCanvas
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  //configura os dados e o design do gráfico
  const data = {
    labels: chartData.map(item => item.genre), //gêneros para o eixo X
    datasets: [{
      label: 'Nota Média por Gênero', //título da série de dados
      data: chartData.map(item => item.averageRating), //notas médias para o eixo Y
      backgroundColor: 'rgba(255, 204, 0, 0.8)', //cor de fundo das barras
      borderColor: 'rgba(255, 153, 0, 1)', //cor da borda das barras
      borderWidth: 1 //largura da borda das barras
    }]
  };

  //configurações adicionais do gráfico (eixos e títulos, por exemplo)
  const config = {
    type: 'bar', //tipo de gráfico barra
    data: data,
    options: {
      scales: {
        x: {
          beginAtZero: true, //inicia o eixo X no zero
          title: {
            display: true,
            text: 'Gênero' //título do eixo X
          }
        },
        y: {
          beginAtZero: true, //inicia o eixo Y no zero
          title: {
            display: true,
            text: 'Nota Média' //título do eixo Y
          }
        }
      }
    }
  };

  //gera o gráfico e salva como PNG
  const image = await chartJSNodeCanvas.renderToBuffer(config);
  fs.writeFileSync('genre_ratings.png', image);
  console.log('Gráfico gerado e salvo como genre_ratings.png');
}

//executa a função para gerar o gráfico
generateChart();
