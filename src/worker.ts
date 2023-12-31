/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const getToken = (id: string) => ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');

const handler: ExportedHandler = {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const { pathname } = url;

		// format: /:id
		if (pathname === '/favicon.ico') {
			return new Response('Not Found', { status: 404 });
		}
		if (pathname === '/' || pathname.indexOf('/') !== pathname.lastIndexOf('/')) {
			return new Response('Bad Request', { status: 400 });
		}

		const id = pathname.slice(1);

		if (id.length > 40 || !/^[0-9]+$/.test(id)) {
			return new Response('Bad Request', { status: 400 });
		}

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

		if (res.status !== 200) {
			return new Response(res.statusText, { status: res.status });
		}

		return new Response(JSON.stringify(await res.json()), {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		});
	},
};

export default handler;
