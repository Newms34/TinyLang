# TinyLang

## Description:
Encoder/decoder, exploring  of JS-F-like encoding using the name of the TINY guild. 

## Usage

### Setup:
1. Install NodeJS if you don't already have it.
2. Go into thefolder where you've downloaded this and run: `npm install`

### Encoding:

```Bash
$node tinylang.js -e someFile.js #Done! File someFile.js encoded and saved at someFile.tiny
```


### Decoding:

```Bash
$node tinylang.js -d someFile.tiny #Done! File someFile.tiny decoded and saved at someFile.js
```

Please note that the parser does _not_ prettify/de-obfuscate your decoded output. That is, your output will still look like the following:
```JavaScript
!![]+!![]+!![]
```
This is, however, still perfectly valid JavaScript!