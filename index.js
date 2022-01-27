import axios from 'axios';
import { JSDOM } from 'jsdom';

const headers = {
	Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
	'content-type': 'text/html;charset=UTF-8',
	Host: 'www.imdb.com',
	'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:88.0) Gecko/20100101 Firefox/88.0',
	Pragma: 'no-cache',
	TE: 'Trailers',
	'Upgrade-Insecure-Requests': 1,
};

const movieUrl = (id) => `https://www.imdb.com/title/${id}`;
const movieSearchUrl = (name) => `https://www.imdb.com/find?s=all&q=${name.replace(/ /g, '%20')}`;

export async function getMovieInfo(id) {
	if (id === null) {
		return null;
	}

	const url = movieUrl(id);
	const { data: html } = await axios.get(url, { headers });

	const dom = new JSDOM(html);
	const document = dom.window.document;

	const content = (sel) => (document.querySelector(sel) || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim();

	let [contentRating, runtime, genres, releaseDate] = content('.title_wrapper .subtext').split('|');
	if (!contentRating) contentRating = '';
	if (!runtime) runtime = '';
	if (!genres) genres = '';
	if (!releaseDate) releaseDate = '';
	genres = genres.split(',').map((x) => x.trim());
	const [releaseDateRaw, day, month, year, extraText] = releaseDate.match(/(\d{1,2}) ([a-z]+) (\d+) (.*)/i) || [0, 0, 0, 0, 0];

	let stars = [];
	document.querySelectorAll('div.credit_summary_item:nth-child(4) a').forEach((x) => {
		x.textContent == 'See full cast & crew' ? '' : stars.push(x.textContent);
	});

	const imageEl = document.querySelector('.slate_wrapper .poster a img');

	return {
		imdbUrl: url,
		title: content('.title_wrapper h1'),
		description: content('.plot_summary .summary_text'),
		rating: +content('.imdbRating .ratingValue strong span'),
		contentRating,
		runtime,
		runtimeMins: +(content('div.txt-block:nth-child(20) > time:nth-child(2)') || '0').replace(/min/gi, ''),
		genres,
		releaseDate:
			releaseDateRaw === 0
				? releaseDate
				: {
						rawText: releaseDateRaw,
						day: +day,
						month,
						year: +year,
						extraText,
				  },
		image: imageEl == null ? null : imageEl.getAttribute('src'),
		stars,
		storyline: content('p:nth-child(1) > span:nth-child(1)'),
		taglines: content('#titleStoryLine > div:nth-child(8)').trim().replace('Taglines:', '').replace('See more »', ''),
	};
}

export async function getMovieId(name) {
	const url = movieSearchUrl(name);
	const { data: html } = await axios.get(url, { headers });

	const dom = new JSDOM(html);
	const document = dom.window.document;

	const findList = document.querySelector('.findSection .findList tbody');

	if (findList === null) return null; // No results for name

	const results = findList.querySelectorAll('.findResult');

	const ids = [];

	results.forEach((r) => {
		ids.push(
			(r
				.querySelector('td.result_text a')
				.getAttribute('href')
				.match(/.*\/(tt\d+)\/.*/) || [0, 0])[1]
		);
	});

	return ids.length === 0 ? null : (ids[0] === 0 ? null : ids[0]);
}

export async function getInfoByName(name) {
	const id = await getMovieId(name);
	return await getMovieInfo(id);
}

// [TestURL:] Singin' in the rain: `tt0045152`
// [TestURL:] Trial of the Chicago 7: `tt1070874`
// getMovieInfo('tt1070874').then(console.log);

// getMovieId('Trial of the Chicago 7').then(getMovieInfo).then(console.log);
// getInfoByName('Trial of the Chicago 7').then(console.log);
