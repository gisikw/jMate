require 'rubygems'
require 'bundler'

Bundler.require

task :default => 'jmate:compile'

namespace :jmate do
  desc 'Compile the files'
  task :compile do
    `coffee -c -o jquery.jmate.js src/jquery.jmate.coffee`
    `sass src/jquery.jmate.sass jquery.jmate.css`
    `haml test/index.haml index.html`
    File.open('jquery.jmate.min.js','w') do |f|
      f.write(JSMin.minify(File.read('jquery.jmate.js'))) 
    end
  end
end
