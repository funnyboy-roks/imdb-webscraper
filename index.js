const axios = require('axios');
const { JSDOM } = require('jsdom');
const fs = require('fs');

const movieUrl = (id) => `https://www.imdb.com/title/${id}`;

async function getMovieInfo(id) {
	const url = movieUrl(id);
	const { data: html } = await axios.get(url, {
		headers: {
			Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
			'content-type': 'text/html;charset=UTF-8',
			Host: 'www.imdb.com',
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:88.0) Gecko/20100101 Firefox/88.0',
			Pragma: 'no-cache',
			TE: 'Trailers',
			'Upgrade-Insecure-Requests': 1,
		},
	});

	const dom = new JSDOM(html);
	const document = dom.window.document;
	console.log(document.querySelector('.title_wrapper h1').textContent);
	const content = (sel) => (document.querySelector(sel) || {}).textContent;
	const contentClean = (sel) => content(sel).replace(/\s+/g, '').trim();

	let [contentRating, runtime, genres, releaseDate] = contentClean('.title_wrapper .subtext').split('|');
	genres = genres.split(',');
	const [releaseDateRaw, day, month, year, extraText] = releaseDate.match(/(\d{1,2})([a-z]+)(\d+)(.*)/i);

	let stars = [];
	document.querySelectorAll('div.credit_summary_item:nth-child(4) a').forEach((x) => {
		x.textContent == 'See full cast & crew' ? '' : stars.push(x.textContent);
	});

	return {
		title: content('.title_wrapper h1'),
		description: content('.plot_summary .summary_text').trim(),
		rating: +contentClean('.imdbRating .ratingValue strong span'),
		contentRating,
		runtime,
		runtimeMins: +((contentClean('div.txt-block:nth-child(20) > time:nth-child(2)') || '0').replace(/min/gi, '')),
		genres,
		releaseDate: {
			rawText: releaseDateRaw,
			day: +day,
			month,
			year: +year,
			extraText,
		},
		image: document.querySelector('.slate_wrapper .poster a img').getAttribute('src'),
		stars,
		storyline: content('p:nth-child(1) > span:nth-child(1)').trim(),
		taglines: content('#titleStoryLine > div:nth-child(8)').textContent.replace('Taglines:', ''),
		
	};
}

// [TestURL:] Singin' in the rain: `tt0045152`
// [TestURL:] Trial of the Chicago 7: `tt1070874`
getMovieInfo('tt1070874').then(console.log);
