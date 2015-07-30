using UnityEngine;
using System.Collections;

public class projectionMatrix : MonoBehaviour {

	// The calculated projection matrix
	Matrix4x4 matrix = new Matrix4x4();
	
	void Start () {
		SetProjectionMatrix ();
	}

	void Update () {
		SetProjectionMatrix();
	}

	// Sets the matrix on the material
	void SetProjectionMatrix () {
		this.matrix = ComputeProjectionMatrix();
		Material myMaterial = renderer.material;
		myMaterial.SetMatrix("_projectionMatrix", this.matrix);
	}

	// Computes the projection matrix
	Matrix4x4 ComputeProjectionMatrix () {
		Mesh mesh = GetComponent<MeshFilter>().mesh;
		Vector3[] vertices = mesh.vertices;
		
		Vector3 topLeft = Camera.main.WorldToScreenPoint(vertices[3]);
		Vector3 topRight = Camera.main.WorldToScreenPoint(vertices[1]);
		Vector3 bottomLeft = Camera.main.WorldToScreenPoint(vertices[0]);
		Vector3 bottomRight = Camera.main.WorldToScreenPoint(vertices[2]);
		
		float x0 = bottomLeft.x;
		float y0 = bottomLeft.y;
		float x1 = bottomRight.x;
		float y1 = bottomRight.y;
		float x2 = topRight.x;
		float y2 = topRight.y;
		float x3 = topLeft.x;
		float y3 = topLeft.y;

		float sigmaX = x0 - x1 + x2 - x3;
		float sigmaY = y0 - y1 + y2 - y3;

		float deltaX1 = x1 - x2;
		float deltaX2 = x3 - x2;
		float deltaY1 = y1 - y2;
		float deltaY2 = y3 - y2;

		float g = (sigmaX * deltaY2 - deltaX2 * sigmaY) / 
				  (deltaX1 * deltaY2 - deltaX2 * deltaY1);
		float h = (deltaX1 * sigmaY - sigmaX * deltaY1) / 
				  (deltaX1 * deltaY2 - deltaX2 * deltaY1);
		
		float a = x1 - x0 + g * x1;
		float b = x3 - x0 + h * x3;
		float c = x0;
		float d = y1 - y0 + g * y1;
		float e = y3 - y0 + h * y3;
		float f = y0;
		
		this.matrix.m00 = a;
		this.matrix.m10 = d;
		this.matrix.m20 = g;
		this.matrix.m01 = b;
		this.matrix.m11 = e;
		this.matrix.m21 = h;
		this.matrix.m02 = c;
		this.matrix.m12 = f;
		this.matrix.m22 = 1;
		this.matrix.SetRow(3, new Vector4(0, 0, 0, 1));
		this.matrix.SetColumn(3, new Vector4(0, 0, 0, 1));
		
		return this.matrix.inverse;
	}

}
