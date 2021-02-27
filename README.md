# congress
shelterDAO is a distributed autonomous organisation. 

Running a linux distribution s.a. Ubuntu, then:\n

Install latest LTS version of node from nodejs.org

``sudo apt-get install git`` 
``git clone https://github.com/kvanstee/congress.git``
``cd congress``
``npm install``
``npm run build``

This will make webpack build a bundle.js file (or several) in app/public.

``cd app/public``
``node server.js``

The app should be running at localhost:8000 
