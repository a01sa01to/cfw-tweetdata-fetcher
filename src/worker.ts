// dummy
interface TweetData { }

const getToken = (id: string) => ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');

const singleFetch = async (id: string) => {
	// ref: https://github.com/vercel/react-tweet/blob/main/packages/react-tweet/src/api/get-tweet.ts
	const fetchUrl = new URL(`https://cdn.syndication.twimg.com/tweet-result`);
	fetchUrl.searchParams.set('id', id);
	fetchUrl.searchParams.set('lang', 'en');
	fetchUrl.searchParams.set(
		'features',
		[
			'tfw_timeline_list:',
			'tfw_follower_count_sunset:true',
			'tfw_tweet_edit_backend:on',
			'tfw_refsrc_session:on',
			'tfw_fosnr_soft_interventions_enabled:on',
			'tfw_show_birdwatch_pivots_enabled:on',
			'tfw_show_business_verified_badge:on',
			'tfw_duplicate_scribes_to_settings:on',
			'tfw_use_profile_image_shape_enabled:on',
			'tfw_show_blue_verified_badge:on',
			'tfw_legacy_timeline_sunset:true',
			'tfw_show_gov_verified_badge:on',
			'tfw_show_business_affiliate_badge:on',
			'tfw_tweet_edit_frontend:on',
		].join(';')
	);
	fetchUrl.searchParams.set('token', getToken(id));

	const res = await fetch(fetchUrl.toString(), {
		headers: {
			'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
		},
	});

	if (res.ok) {
		return res.json<TweetData>();
	}
	else {
		return null;
	}
}

const handler: ExportedHandler = {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const { pathname } = url;
		console.log(pathname)

		// format: /:id,:id,...
		if (pathname === '/favicon.ico') {
			return new Response('Not Found', { status: 404 });
		}
		if (pathname === '/' || pathname.indexOf('/') !== pathname.lastIndexOf('/')) {
			return new Response('Bad Request', { status: 400 });
		}

		const ids = pathname.slice(1).split(',');

		if (ids.some(id => id.length > 40 || !/^[0-9]+$/.test(id))) {
			return new Response('Bad Request', { status: 400 });
		}

		if (request.method === "OPTIONS") {
			return new Response('OK', {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET,OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
					'Access-Control-Max-Age': '31536000',
				},
			});
		}

		const obj = Object.fromEntries(await Promise.all(ids.map(async id => [id, await singleFetch(id)])))

		return new Response(JSON.stringify(obj), {
			headers: {
				'Content-Type': 'application/json;charset=UTF-8',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET,OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Max-Age': '31536000',
			},
		});
	},
};

export default handler;
