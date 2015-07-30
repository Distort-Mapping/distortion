using System;
using System.Collections.Concurrent;
using System.IO;
using System.Reflection;
using Alchemy;
using Alchemy.Classes;
using ServiceStack.CacheAccess.Providers;
using ServiceStack.ServiceInterface;
using ServiceStack.Text;
using SimpleJSON;
using UnityEngine;

public class StartHostBehavior : MonoBehaviour {
}

public class StartHost : StartHostBehavior, IDisposable {

    protected static ConcurrentDictionary<string, UserContext> OnlineUsers = new ConcurrentDictionary<string, UserContext>();
    const int NoOfShards = 10;
    const int NoOfRobots = 1000;
    public string host = "http://*:80/";
    public string webrootPath = "webroot";

	private int zIndexCounter = 999;

    private AppHost appHost;
    private WebSocketServer wsServer;
    private bool isConnected;
	private bool shouldHideIP;
    private Do pos = new Do();
    private ServiceStack.CacheAccess.ICacheClient Cache;

 	void OnGUI() {
		if (!shouldHideIP) {
            var textStyle = new GUIStyle();
            textStyle.fontSize = 40;
            textStyle.normal.textColor = Color.white;
			GUI.Label (new Rect (10, 10, 250, 20), "Server listening at: " + Network.player.ipAddress + "/home", textStyle);
		}
	}

    void Start() {

		// search for textures
		var texturepath = String.Concat(Environment.CurrentDirectory, @"\webroot\textures");
		var info = new DirectoryInfo(texturepath);
		var fileInfo = info.GetFiles();
		var availableTextures = new String[fileInfo.Length];
		foreach(FileInfo file in fileInfo){

			Debug.Log(file.Name);
		}

		// write config file
		string path = String.Concat(Environment.CurrentDirectory, @"\webroot\js\server-config.js");
		TextWriter configFile = new StreamWriter(path);
		configFile.WriteLine("function ServerConfig(){");
		configFile.WriteLine(String.Concat(@"this.ip = """, Network.player.ipAddress, @""";"));
		configFile.WriteLine(String.Concat(@"this.screenWidth = ", Screen.width, @";"));
		configFile.WriteLine(String.Concat(@"this.screenHeight = ", Screen.height, @";"));

		// write texture array
		configFile.WriteLine("this.textures = [");
		for(var i = 0; i < fileInfo.Length; i++){
			if(i == fileInfo.Length - 1) {
				configFile.WriteLine(String.Concat(@"""", fileInfo[i].Name, @""""));
			} else {
				configFile.WriteLine(String.Concat(@"""", fileInfo[i].Name, @""","));
			}
		}
		configFile.WriteLine("]");


		configFile.WriteLine("}");
		configFile.Close ();

        try {
            // create and start the host
            appHost = new AppHost();
            appHost.Config.WebHostPhysicalPath = Path.Combine(Directory.GetCurrentDirectory(), webrootPath);
            appHost.Init();
            appHost.Start(host);
            Debug.Log("Server listening at http://" + Network.player.ipAddress + "/home");
            Cache = appHost.GetCacheClient();
        }
        catch (Exception exeption) {
			Debug.Log(exeption);
            Cache = new MemoryCacheClient();
        }
        var instance = FindObjectOfType(typeof(Exec)) as Exec;
        if (instance == null) {
            instance = gameObject.AddComponent<Exec>();
        }

        wsServer = new WebSocketServer(1081) {
            OnDisconnect = context => {
				print("DISCONNECT");
            },

			// Called when the server connects
            OnConnected = context => {
                var response = (object)null;
                isConnected = true;
                GameObject cached = default(GameObject);
				shouldHideIP = true;
				OnGUI();

                if (!OnlineUsers.ContainsKey(context.ClientAddress.ToString())) {
                    OnlineUsers[context.ClientAddress.ToString()] = context;
                }

				// Called when the server disconnects
                context.SetOnDisconnect((e) => {
                    UserContext ctx = null;
                    OnlineUsers.TryRemove(e.ClientAddress.ToString(), out ctx);
                    if (ctx != null) {
                        Exec.OnMain(() => Debug.Log("User: " + ctx.ClientAddress + " has disconnected"));
                    }
                });

				// Called when new data is received over the socket
                context.SetOnReceive((e) => {
                    try {
						var jsonObject = JSON.Parse(e.DataFrame.ToString());
						var eventIdentifier = jsonObject["event_identifier"].Value;
						var uuid = jsonObject["uuid"].Value;

						switch (eventIdentifier) {

						case "create_rect":
							Exec.OnMain(() => {
								GameObject rect = GameObject.CreatePrimitive(PrimitiveType.Quad);
								rect.name = uuid;
								rect.transform.position = new Vector3(0, 0, zIndexCounter);
								zIndexCounter--;

								//set shaders and custom behaviours
								rect.renderer.material.shader = Shader.Find("Custom/transform");
								moveRect moveBehaviour = rect.AddComponent("moveRect") as moveRect;
								projectionMatrix matrix = rect.AddComponent("projectionMatrix") as projectionMatrix;
								vertexPositions vertexPositioning = rect.AddComponent<vertexPositions> () as vertexPositions;

								//set intitial position
								vertexPositioning.moveVertices(jsonObject["positions"]);

								//set the texture of the new rect
								var initTextureURL = jsonObject["texture"]["url"].Value;
								WWW initialtexture = new WWW(initTextureURL);
								while(!initialtexture.isDone) {
									var dumm = "blöd";
								}
								Texture texture = initialtexture.texture;
								rect.renderer.material.mainTexture = texture;

								Debug.Log("Received create_rect command, new rect with uuid: " + uuid);
							});
							break;

						case "delete_rect":
							Exec.OnMain(() => {
								GameObject rect = GameObject.Find(uuid);
								Destroy(rect);
								Debug.Log("Received delete_rect command for rect with uuid: " + uuid);
							});
							break;

						case "move_rect":
							Exec.OnMain(() => {
								GameObject rect = GameObject.Find(uuid);
								var moveBehaviour = rect.GetComponent<vertexPositions>();
								moveBehaviour.moveVertices(jsonObject["positions"]);
								Debug.Log("Received move_rect command");
							});
							break;

						case "move_vertice":
							// The index of the vertice that should be moved.
							var verticeIndex = 0;
							Vector2 verticeDelta;
								switch (jsonObject["vertice"].Value) {
								case ("top_left"):
									break;
								case ("top_right"):
								verticeIndex = 1;
									break;
								case ("bottom_right"):
								verticeIndex = 2;
									break;
								case ("bottom_left"):
								verticeIndex = 3;
									break;
								}
							var delta = jsonObject["vertice"];
							verticeDelta.x = delta["x"].AsFloat;
							verticeDelta.y = delta["y"].AsFloat;

							Exec.OnMain(() => {
								GameObject rect = GameObject.FindWithTag(uuid);
								Debug.Log("Received move_vertice command for the vertice: " + jsonObject["vertice"].Value + " and delta: " + verticeDelta);
							});

							break;

						case "change_texture":

							var textureURL = jsonObject["texture"]["url"].Value;

							Exec.OnMain(() => {

								WWW webTexture = new WWW(textureURL);
								//yield return webTexture;
								while(!webTexture.isDone) {
									var dumm = "blöd";
								}

								Texture newTexture = webTexture.texture;

								GameObject rect = GameObject.Find(uuid);
								rect.renderer.material.mainTexture = newTexture;
								Debug.Log("Received change_texture command");
							});

							break;

						default:
							break;

						}

                        var v = e.DataFrame.ToString().FromJson<Do>();
                        var ou = new { rcvd = e, t = DateTime.Now };

                        foreach (var userContext in OnlineUsers) {
                            if (userContext.Key != context.ClientAddress.ToString()) {
                                userContext.Value.Send(v.ToJson());
                            }
                        }
                    }
                    catch (Exception exeption)
                    {
                        Exec.OnMain(() => Debug.Log(exeption));
                    }
                });
            }
        };

		// Starting the server
        wsServer.Start();

        // suppossed to register the log callback...
        Application.RegisterLogCallback((log, stack, type) =>
        {
            foreach (var userContext in OnlineUsers)
            {
                userContext.Value.Send(new { log, stack, type}.ToJson());
            }
        });

    }

    void OnDisable() {
        isConnected = false;
        if (appHost != null) {
            appHost.Stop();
        }

        foreach (var userContext in OnlineUsers) {
            var prop = typeof(UserContext).GetField("Context", BindingFlags.NonPublic | BindingFlags.Instance);

            if (prop != null) {
                var context = prop.GetValue(userContext.Value) as Context;
                if (context != null) {
                    context.Disconnect();
                }
            }
        }

        OnlineUsers.Clear();
		if (wsServer != null) {
			wsServer.Stop();
		}
    }

    public void Dispose() {
        appHost.Dispose();
        wsServer.Dispose();
    }
}
