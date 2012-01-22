var githubAPI = {
    // A Repository
    "https://api.github.com/repos/*/*":

    {
	'$':
	{
	    '@id': [{'f:valueof': 'url'}],
	    '@ns': {'ns:default': 'gh'},
	    '@context': {'gh': 'https://api.github.com/vocabulary#'},
	    '@type': ['https://api.github.com/vocabulary#Repository'],
	    '@only': ['name', 'watchers', 'forks', 'description', 'owner', 'url']
	},
	
	'$.owner':
	{
	    '@ns': {'ns:default': 'gh',
	            'ns:replace': {'avatar_url':'foaf:depiction'}},
	    '@context': {'gh': 'https://api.github.com/vocabulary#',
			 'foaf': 'http://xmlns.com/foaf/0.1/',
			 'foaf:depiction': {'@type': '@id'}},
	    '@type': ['https://api.github.com/vocabulary#User',
		      'http://xmlns.com/foaf/0.1/Person'],
	    '@id': [{'f:valueof': 'url'}],
	    '@remove': ['url']
	}
    },


    // People collaborating in the project
    "https://api.github.com/repos/*/*/collaborators":

    {
	'$': 
	{
	    '@ns': {'ns:defaul': 'gh',
	            'ns:replace': {'avatar_url':'foaf:depiction'}},
	    '@context': {'gh': 'https://api.github.com/vocabulary#'},
	    '@type': ['https://api.github.com/vocabulary#User',
		      'http://xmlns.com/foaf/0.1/Person'],
	    '@id': [{'f:valueof': 'url'}],
	    '@remove': ['url']
	}
    }

};

module.exports = githubAPI;