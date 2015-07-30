using UnityEngine;
using System.Collections;
using SimpleJSON;

public class vertexPositions : MonoBehaviour {

	public void moveVertices(JSONNode positions) {
		Mesh mesh = GetComponent<MeshFilter> ().mesh;
		Vector3[] vertices = mesh.vertices;

		Vector3 invertY = new Vector3 (1, -1, 1);

		// Set top left
		JSONNode tl = positions["top_left"];
		Vector3 tlverts = new Vector3 (tl["x"].AsFloat, tl["y"].AsFloat, 0);
		vertices [3] = Vector3.Scale (tlverts, invertY);

		// Set top right
		JSONNode tr = positions["top_right"];
		Vector3 trverts = new Vector3 (tr["x"].AsFloat, tr["y"].AsFloat, 0);
		vertices [1] = Vector3.Scale (trverts, invertY);

		// Set top left
		JSONNode bl = positions["bottom_left"];
		Vector3 blverts = new Vector3 (bl["x"].AsFloat, bl["y"].AsFloat, 0);
		vertices [0] = Vector3.Scale (blverts, invertY);

		// Set top left
		JSONNode br = positions["bottom_right"];
		Vector3 brverts = new Vector3 (br["x"].AsFloat, br["y"].AsFloat, 0);
		vertices [2] = Vector3.Scale (brverts, invertY);

		mesh.vertices = vertices;
		mesh.RecalculateNormals ();
	}
}
