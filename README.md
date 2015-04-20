I always thought that AWS S3 should just resize your images when you put them into a bucket. It doesn't. However with the new Lambda service it can.        

```text
.---.                                   _______                                
|   |          __  __   ___   /|        \  ___ `'.                             
|   |         |  |/  `.'   `. ||         ' |--.\  \                            
|   |         |   .-.  .-.   '||         | |    \  '                           
|   |    __   |  |  |  |  |  |||  __     | |     |  '    __                    
|   | .:--.'. |  |  |  |  |  |||/'__ '.  | |     |  | .:--.'.                  
|   |/ |   \ ||  |  |  |  |  ||:/`  '. ' | |     ' .'/ |   \ |                 
|   |`" __ | ||  |  |  |  |  |||     | | | |___.' /' `" __ | |                 
|   | .'.''| ||__|  |__|  |__|||\    / '/_______.'/   .'.''| |                 
'---'/ /   | |_               |/\'..' / \_______|/   / /   | |_                
     \ \._,\ '/               '  `'-'`               \ \._,\ '/                
      `--'  `"                                        `--'  `"                 
.--. __  __   ___                          __.....__                           
|__||  |/  `.'   `.            .--./)  .-''         '.                         
.--.|   .-.  .-.   '          /.''\\  /     .-''"'-.  `.                       
|  ||  |  |  |  |  |    __   | |  | |/     /________\   \                      
|  ||  |  |  |  |  | .:--.'.  \`-' / |                  |                      
|  ||  |  |  |  |  |/ |   \ | /("'`  \    .-------------'                      
|  ||  |  |  |  |  |`" __ | | \ '---. \    '-.____...---.                      
|__||__|  |__|  |__| .'.''| |  /'""'.\ `.             .'                       
                    / /   | |_||     ||  `''-...... -'                         
                    \ \._,\ '/\'. __//                                         
                     `--'  `"  `'---'                                          
              __.....__             .--.                __.....__              
          .-''         '.           |__|            .-''         '.            
.-,.--.  /     .-''"'-.  `.         .--.           /     .-''"'-.  `. .-,.--.  
|  .-. |/     /________\   \        |  |          /     /________\   \|  .-. | 
| |  | ||                  |    _   |  |.--------.|                  || |  | | 
| |  | |\    .-------------'  .' |  |  ||____    |\    .-------------'| |  | | 
| |  '-  \    '-.____...---. .   | /|  |    /   /  \    '-.____...---.| |  '-  
| |       `.             .'.'.'| |//|__|  .'   /    `.             .' | |      
| |         `''-...... -'.'.'.-'  /      /    /___    `''-...... -'   | |      
|_|                      .'   \_.'      |         |                   |_|      
                                        |_________|                            
```

The code found in this project was inspired by this [amazon documenation](https://docs.aws.amazon.com/lambda/latest/dg/walkthrough-s3-events-adminuser-create-test-function-create-function.html).

###Setup

Setup AWS Lambda, if you don't know how to do this there is a [Getting Started][1] guide from Amazon.

[1]: https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html        

To test your changes on this repository you should install [node-lambda](https://github.com/RebelMail/node-lambda). This is a really simple command line utility to test your lambda funcation and post the function to AWS.

    npm install -g node-lambda

Then use node-lambda to create some easy configuration files

    node-lambda setup

Initializes the `event.json` and `.env` files. `event.json` is where you mock your event. `.env` is where you place your deployment configuration.

Next you need to change the configuration of the function to suit your needs. The variable `sizeConfigs` hold and array of configurations for image sizes and postfixes associated with the image. Our function takes the image added to the source bucket and put multiple resized copies of that image into a destination bucket. It uses the file name to create a new folder in the destination bucket and images placed in that bucket have the specific postfixes appended to the fill name. Images are also converted to JPEG.

For example:

    'img_001.jpeg' ->  'img_001/img_001_w1000.jpg'
                       'img_001/img_001_w480.jpg'
                       'img_001/img_001_h200.jpg'
                       'img_001/img_001_w100.jpg'

or

    'panda.png' ->  'panda/panda_w1000.jpg'
                    'panda/panda_w480.jpg'
                    'panda/panda_h200.jpg'
                    'panda/panda_w100.jpg'


###Where to go from here:

This is just a project that worked for me I hope other will find it useful to jumpstart their development with Lambda. Like I mentioned before I alwasy thought S3 should just have this kind of functionality built into it but compute time cost more than storage nowadays.

It would be great if this also worked with Cloudfront, a service I don't use so it might be really easy to go in that direction, it might not. 

I also think 