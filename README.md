# pomdor
A Team shared timer ispired by the pomodoro tecnique
## How to build
simply clone the repo
```sh
git clone git@github.com:evoluzione/pomdor.git 
cd pomdor
npm install
```
edit the timer.json inside src
```sh
cd src
vim timers.json
```
and then build your shared timer
```sh
npm run make
```
et voilà....
have fun
## Structure of a timer
```json
{
    "name": "C1",
    "type": "pause",
    "start": "10:10:00",
    "end": "10:15:00"
  },
```
the field names are quite explanatory

*name*: the name showed by the tooltip  
*type*: the type currently we support "work" and "pause"  
*start*: the start time  
*end*: the end time  
