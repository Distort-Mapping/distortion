//
// This shader is meant for perspective transformation in 
// combination 
// Written by Silvan Dähn, 2014
//

Shader "Custom/transform" {

 Properties {
         _MainTex ("Texture", 2D) = "white" {}
     }
     
     SubShader {
         Pass {
         
         CGPROGRAM
         #pragma vertex vert
         #pragma fragment frag
         #include "UnityCG.cginc"
 
 		// 2D texture and 3D projection matrix 
         sampler2D _MainTex;
         float4x4 _projectionMatrix;
         
         struct v2f {
         	// vertex position (x,y,z,w) 
         	// w is the value for the homogeneous space
             float4 pos : SV_POSITION;
            // texture coordinates u and v
             float2 uv : TEXCOORD0;
         };
 
 		float4 _MainTex_ST;
 		
         v2f vert (appdata_base v) {
            v2f o;
           
            o.pos = mul (UNITY_MATRIX_MVP, v.vertex);
            
            //NEW
            o.uv = 0.5 * (1 + o.pos) * _ScreenParams.xy;
            
            return o;
        }
 
         float4 frag(v2f i) : COLOR {
         	//NEW
          	//float4 p = mul(_projectionMatrix, float4(i.uv.x, i.uv.y, 0, 1));
			//i.uv.x = p.x;
			//i.uv.y = p.y;
			float4 p = mul(_projectionMatrix, float4(i.uv.x, i.uv.y, 1, 0));
			i.uv.x = p.x/p.z;
			i.uv.y = p.y/p.z;
			
			return tex2D(_MainTex, i.uv);
         }
 
         ENDCG
         
         }
     }
     Fallback "VertexLit"
 }