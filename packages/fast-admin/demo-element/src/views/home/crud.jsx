import { compute, dict } from "@fast-crud/fast-crud";
import * as api from "/src/views/home/api";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ({ crudRef }) {
  const pageRequest = async (query) => {
    return await api.GetList(query);
  };
  const editRequest = async ({ form, row }) => {
    form.id = row.id;
    return await api.UpdateObj(form);
  };
  const delRequest = async ({ row }) => {
    return await api.DelObj(row.id);
  };

  const addRequest = async ({ form }) => {
    return await api.AddObj(form);
  };
  return {
    table: {
      show: true
    },
    options: {},
    request: {
      pageRequest,
      addRequest,
      editRequest,
      delRequest,
      transformQuery: ({ page, form }) => {
        return { current: page.currentPage, size: page.pageSize, ...form };
      },
      transformRes: ({ res }) => {
        return { currentPage: res.current, pageSize: res.size, ...res };
      }
    },
    actionbar: {
      buttons: {
        add: {
          type: "primary",
          text: "添加"
        }
      },
      show: true
    },
    form: {
      wrapper: {},
      options: {}
    },
    columns: {
      date: {
        title: "日期",
        column: {
          sortable: true
        }
      },
      name: {
        title: "姓名",
        type: "text",
        search: { show: true },
        column: {
          component: {
            name: "el-button",
            children: {
              default: (scope) => {
                return <div>{scope.row.name}</div>;
              }
            },
            style: "width:100px",
            events: {
              onClick: (context) => {
                console.log("clicked", context);
                context.row.name = context.row.name === "李四" ? "王小虎" : "李四";
              },
              onChange(context) {
                console.log("on change", context);
              },
              onInput(context) {
                console.log("on input", context);
              }
            }
          }
        }
      },
      avatar: {
        title: "头像",
        search: { show: true },
        column: {
          align: "center",
          show: compute(() => {
            return true;
          }),
          component: {
            show: compute((context) => {
              return context.row?.show === true;
            }),
            name: "el-image",
            vModel: "src",
            style: { height: "30px" },
            fit: "contain",
            children: {
              error: () => {
                return (
                  <div class="image-slot">
                    <i class="el-icon-picture-outline" />
                  </div>
                );
              }
            }
          }
        },
        form: {
          component: {
            name: "el-image",
            vModel: "src",
            style: "width:70px"
          },
          style: {
            "grid-column": "span 2" // 跨2列
          },
          show: compute((context) => {
            console.log("show context", context);
            return context.form.show === false;
          })
        }
      },
      show: {
        title: "显隐",
        column: {
          component: {
            name: "el-switch",
            events: {
              onChange(context) {
                console.log("switch context", context);
              }
            }
          }
        },
        form: {
          title: compute((context) => {
            console.log("xianyin ,", context);
            return context.form.show ? "隐藏头像" : "显示头像";
          }),
          component: {
            name: "el-switch"
          },
          style: {
            "grid-column": "span 2" // 跨2列
          }
        }
      },
      addressGroup: {
        title: "地址",
        children: {
          province: {
            title: "省份",
            type: "select",
            search: { show: true },
            dict: dict({
              url: "/dicts/OpenStatusEnum"
            })
          },
          city: {
            title: "城市",
            type: "select",
            dict: dict({
              url: "/dicts/OpenStatusEnum"
            })
          },
          address: {
            title: "地址",
            search: {
              show: true
            },
            type: "textarea"
          }
        }
      },
      zip: {
        title: "邮编"
      }
    },
    rowHandle: {
      title: "操作",
      width: "300px",
      edit: {
        icon: "el-icon-edit",
        text: null
      },
      custom: [
        {
          text: "custom",
          click() {
            console.log("1111");
          }
        }
      ]
    },
    data: []
  };
}
