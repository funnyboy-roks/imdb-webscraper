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

	fs.writeFileSync(id + '.html', html);

	const dom = new JSDOM(html);
	const document = dom.window.document;
	console.log(document.querySelector('.title_wrapper h1').textContent);
	const content = (sel) => (document.querySelector(sel) || {}).textContent;
	const contentClean = (sel) => content(sel).replace(/\s+/g, '').trim();

	let [contentRating, runtime, genres, releaseDate] = contentClean('.title_wrapper .subtext').split('|');
	genres = genres.split(',');
	const [releaseDateRaw, day, month, year, extraText] = releaseDate.match(/(\d{1,2})([a-z]+)(\d+)(.*)/i);

	let runtimeMins = 0;
	runtime.match(/\d+[a-z]+/gi).forEach((s) => {
		if (s.endsWith('h')) {
			runtimeMins += +s.replace(/h/, '') * 60;
		} else {
			runtimeMins += +s.replace(/min/, '');
		}
	});

	return {
		title: content('.title_wrapper h1'),
		description: content('.plot_summary .summary_text').trim(),
		rating: +contentClean('.imdbRating .ratingValue strong span'),
		contentRating,
		runtime,
		runtimeMins,
		genres,
		releaseDate: {
			rawText: releaseDateRaw,
			day: +day,
			month,
			year: +year,
			extraText,
		},
		image: document.querySelector('.slate_wrapper .poster a img').getAttribute('src'),
	};
}

// [TestURL:] Singin' in the rain: `tt0045152`
// [TestURL:] Trial of the Chicago 7: `tt1070874`
getMovieInfo('tt0045152').then(console.log);
