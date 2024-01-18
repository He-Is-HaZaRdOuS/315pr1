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
5. Run the commands below to install parcel and three.JS.

```bash
npm install
npm install parcel --save-dev
npm install three
```
</br>
6. Start a local server using parcel.
   
```bash
npx parcel src/index.html --port 3000
``` 
CTRL + C to terminate it. <br>
If localhost refused to connect, change the port and try again. </br> </br>
7. Open the generated http link in your browser. </br> </br>
8. ??? </br> </br>
9. Profit! </br> </br>

## TODO
- [ ] Establish Solid 3D Plane.
- [ ] Get Camera and WSAD Movements.
- [ ] Import 3D Models.
- [ ] Implement Collision Logic.
- [ ] TBD...
