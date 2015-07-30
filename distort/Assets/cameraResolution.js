#pragma strict

function Start () {
	var camera = camera;
	
	camera.rect = Rect(0, 0, Screen.width, Screen.height);
	camera.orthographicSize = Screen.height/2;
	
	camera.transform.position = Vector3(Screen.width/2, Screen.height/2*-1, 0);
	
}

function Update () {

}