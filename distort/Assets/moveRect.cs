using UnityEngine;
using System.Collections;

public class moveRect : MonoBehaviour {

	public void Move(float x, float y) {
		Mesh objectMesh = GetComponent<MeshFilter> ().mesh;
		Vector3[] vertices = objectMesh.vertices;

		x = x / 200;
		y = y / -200;

		// Calculate the differences from the vertices to the top left vertice
		Vector3 topLeft = vertices[3];
		Vector3 center = new Vector3 ((topLeft.x - vertices [2].x) / 2, (topLeft.y - vertices [2].y) / 2);
		gameObject.transform.position = center + new Vector3 (x, y, 0);
	}
}
