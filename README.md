flappybird
==========
A HTML5 version FlappyBird with auto-playing.

Try it out at:
http://xiaohuahua.org/fb

Watch a demo video:

[![FlappyBird with auto-playing](http://img.youtube.com/vi/cgb_p0LOPd0/0.jpg)](http://www.youtube.com/watch?v=cgb_p0LOPd0)


Auto-Playing
------------
Auto-Playing is achieved by performe a local A* search to reach the center of next pipe.

Each frame, the bird can either:

1. Jump ?
2. Do nothing

System Peremters
----------------
System peremters include:

1. Flying speed
2. Jumping speed
3. Gravity
4. Path height: vertical distance between up and bottom pipes
5. Horizontal distance between pipes

The system is very sensetive, little change to it will make it from a very easy game (for computer only) to an insane one, actually it's impossible to pass through under that circumstance.

In order to be more realistic, the computer is limited to jump only once every 8 frames (133ms).

