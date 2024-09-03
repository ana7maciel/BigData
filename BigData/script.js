import jsdom from 'jsdom';
import fs from 'fs';
import fetch from 'node-fetch';

const { JSDOM } = jsdom; //desestruturação para extrair a classe JSDOM do pacote jsdom

//função para converter dados para CSV
function toCSV(data) {
    //define o cabeçalho do CSV
  const header = 'Nome, Gênero, Nota\n';
  //mapeia os dados dos filmes para linhas em CSV, cercando os valores com aspas duplas
  const rows = data.map(filme => `"${filme.nome}","${filme.genero}","${filme.nota}"`).join('\n');
  //retorna o conteúdo completo do CSV (cabeçalho + linhas)
  return header + rows;
}

//função principal para coletar e salvar dados
async function init() {
  try {
    //faz uma requisição HTTP para carregar a página
    const response = await fetch("https://www.imdb.com/chart/moviemeter/");
    //seleciona somente o HTML carregado, como uma string
    const html = await response.text();
    //inicia o JSDOM passando o HTML carregado
    const dom = new JSDOM(html);
    //guarda o objeto document em uma variável
    const document = dom.window.document;

    //seleciona o conteúdo do script que contém o JSON dos filmes
    const scriptContent = document.querySelector('script[type="application/ld+json"]').textContent;
    const objetoFilmes = JSON.parse(scriptContent);

    //verifica se itemListElement está presente
    if (!objetoFilmes.itemListElement) {
      throw new Error("O JSON não contém a propriedade 'itemListElement'.");
    }

    //extrai as informações dos filmes
    const filmes = objetoFilmes.itemListElement.map(filme => {
      const item = filme.item || {};
      return {
        nome: item.name || 'Nome não disponível',
        genero: item.genre || 'Gênero não disponível',
        nota: item.aggregateRating ? item.aggregateRating.ratingValue : 'Nota não disponível'
      };
    });

    //converte os dados para CSV e salva no arquivo
    const csv = toCSV(filmes);
    fs.writeFileSync("filmes.csv", csv);

    console.log("Dados dos filmes salvos em filmes.csv");
  } catch (error) {
    console.error("Erro ao coletar dados:", error);
  }
}

//inicializa a função assíncrona logo depois de invocá-la
init();
