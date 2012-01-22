var googleplusAPI = {
    
    // People search
    "https://www.googleapis.com/plus/v1/people":
    {
	'$':
	{
	    '@ns': {'ns:default': 'gp'},
	    '@context': {'gp': 'https://www.googleapis.com/plus/v1/'},
	    '@only': ['items']
	},
	
	'$.items[*]':
	{
	    '@ns': {'ns:default': 'gp'},
	    '@context': {'gp': 'https://www.googleapis.com/plus/v1/'},
	    '@id': [{'f:valueof':'url'}],
	    '@type': [{'f:valueof': 'kind'},
		      {'f:prefix': 'https://www.googleapis.com/'}],
	    '@only': ['id', 'displayName']
	}
    },

    // Single person
    "https://www.googleapis.com/plus/v1/people/*":
    {
	'$':
	{
	    '@ns': {'ns:default': 'gp'},
	    '@context': {'gp': 'https://www.googleapis.com/plus/v1/'},
	    '@type': [{'f:valueof': 'kind'},
		      {'f:prefix': 'https://www.googleapis.com/'}],
	    '@transform': {'urls': [{'f:valueof':'urls'},
				    {'f:select': 'value'}]},
	    '@only': ['displayName', 'urls']
	},
    }

};

module.exports = googleplusAPI;