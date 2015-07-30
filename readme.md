<img src="Logo.png" width="250" alt="Distort Logo">

## Welcome to *Distort*  
Distort is a two part projection mapping software build at the University of Hamburg as part of the HCI-Project class 2014/15. The application consists of a angular webapp that will run on any tablet and of a server running on a local machine build with unity3D. Distort gives you the capability to project onto a 3D model with up to 3 Beamers from different angles, while aligning your textures remotly from a mobile device and our webapp.

#### JSON format:

##### move_rect
```json
	{
	"event_identifier": "move_rect",
 	 "uuid": "1jlk2j198dlk1jedjn129",
  	 "delta": {
  	 			"x": 12,
  			    "y": -3
  			   }
 	}
```

##### move_vertice
```json
	{
	"event_identifier": "move_vertice",
 	 "uuid": "1jlk2j198dlk1jedjn129",
 	 "vertice": "top_left",
  	 "delta": {
  	 		   "x": 12,
  			   "y": -3
  			  }
 	}
```

##### create_rect
```json
	{
	"event_identifier": "create_rect",
 	 "uuid": "1jlk2j198dlk1jedjn129",
  	 "positions": {
  	 			"top_left": {
  	 						"x":-3,
  	 						"y": 3
  	 						},
  			    "top_right": {
  	 						 "x": 3,
  	 						 "y": 3
  	 						},
  			    "bottom_right": {
  	 						    "x": 3,
  	 						    "y":-3
  	 							},
  	 			"bottom_left": {
  	 						   "x":-3,
  	 						   "y":-3
  	 						   },
  			   }
 	}
```
##### delete_rect
```json
	{
		"event_identifier": "delete_rect",
 	 	"uuid": "1jlk2j198dlk1jedjn129",
	}
```
##### change_texture
```json
	{
		"event_identifier": "change_texture",
	 	"uuid": "1jlk2j198dlk1jedjn129",
	 	"texture_uuid": "1s83j198dlkasds82kc5"
	 }
```
