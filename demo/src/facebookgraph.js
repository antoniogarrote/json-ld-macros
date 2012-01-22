var fbgraphAPI = {
    "https://graph.facebook.com/*":
    {
	'$':
	{
	    '@ns': {'ns:defaul': 'og'},
	    '@context': {'og': 'http://ogp.me/ns#',
			 'og:link': {'@type': '@id'}},
	    '@type': [{'f:valueof':'type'},
		      {'f:prefix':'http://ogp.me/ns#'}],
	    '@id': [{'f:valueof': 'id'},
		    {'f:prefix':'http://graph.facebook.com/'}],
	    '@remove': ['id', 'type']
	},

	'$.location':
	{
	    '@ns': {'ns:defaul': 'og'},
	    '@context': {'og': 'http://ogp.me/ns#'},
	    '@type': 'http://ogp.me/ns#Page',
	    '@id': [{'f:valueof': 'id'},
		    {'f:prefix':'http://graph.facebook.com/'}]
	}
    },

    "https://graph.facebook.com/*/photos":
    {
	'$.data':
	{
	    '@ns': {'ns:defaul': 'og'},
	    '@context': {'og': 'http://ogp.me/ns#',
			 'og:picture': {'@type': '@id'}},
	    '@type': [{'f:valueof':'type'},
		      {'f:prefix':'http://ogp.me/ns#'}],
	    '@id': [{'f:valueof': 'id'},
		    {'f:prefix':'http://graph.facebook.com/'}],
	    '@only': ['from', 'picture']
	},

	'$.data.from': {
	    '@id': [{'f:valueof': 'id'},
		    {'f:prefix': 'http://graph.facebook.com/'}],
	    '@remove': ['name','category','id']
	}
    }
};


exports = fbgraphAPI;