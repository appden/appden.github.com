
desc "Build site using Jekyll"
task :build do
  sh "rm -rf _site"
  sh "jekyll"
end

namespace :deploy do
  desc "Deploy to Dev"
  task :dev => :build do
    rsync "dev.appden.com"
  end
  
  desc "Deploy to Live"
  task :live => :build do
    rsync "appden.com"
  end
  
  desc "Deploy to Dev and Live"
  task :all => [:dev, :live]
  
  def rsync(domain)
    sh "rsync -rtz --delete _site/ scottwkyle@appden.com:~/#{domain}/"
  end
end

desc "Deploy to Live"
task :deploy => :"deploy:dev"

