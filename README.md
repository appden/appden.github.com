Migrating AppDen.com to Jekyll
==============================

Once I read about Jekyll, I fell in love with the simplicity of using text rather than a database, static pages (big reason why I chose Movable Type) rather than dynamic ones, and something in active development by the GitHub team.

### Movable Type

I think Movable Type is great, especially for non-programmers, and overall much better written than Wordpress, though much less flexible. However, too many little things have bothered me to the point of making me reluctant to touch my blog in order to avoid frustration.  Deploying updated templates is a bitch, the template language is quite annoying to use as a programmer, and the default templates and JavaScript were all written below my personal standards. Subsequently, I rewrote the frontend mostly from scratch, which I hope to post on GitHub in the near future, and wrote an SVN hook to ease deployment.

### Moving Forward

Once I'm comfortable with Jekyll by playing around in this repository, I plan to create an instance locally on my Mac to begin real development. Once I'm ready to deploy, I'll setup my live instance on DreamHost using [this guide from Tate Johnson][guide]. For comments, I'm looking forward to using [DISQUS][].

[guide]: http://tatey.com/2009/04/29/jekyll-meets-dreamhost-automated-deployment-for-jekyll-with-git.html
[DISQUS]: http://disqus.com