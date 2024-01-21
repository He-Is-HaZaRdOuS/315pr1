# 315pr1
placeholder repository for CENG315's final assignment. </br>

## Installing && Running
1. Clone this repo to your computer. </br> </br>
2. Install Node.js and NPM. </br>
### (Windows && MacOS)
https://nodejs.org/en/download/ </br>
### (Ubuntu Linux)
https://linuxize.com/post/how-to-install-node-js-on-ubuntu-20-04/ </br> </br>
4. cd into the project root.

```bash
cd 315pr1
```
</br>
5. Run the commands below to install dependencies.

```bash
npm install cannon-es
npm install parcel
npm install three
```
</br>
6. Start a local server using parcel.
   
```bash
npx parcel src/main.html --port 3000
``` 
CTRL + C to terminate it. <br>
If localhost refused to connect, change the port and try again. </br> </br>
7. Open the generated http link in your browser. </br> </br>
8. ??? </br> </br>
9. Profit! </br> </br>

## TODO
- [x] Establish Solid 2D Plane.
- [x] Get Camera and WSAD Movements.
- [x] Import 3D Models.
- [x] Implement Collision Logic.
- [ ] TBD...
