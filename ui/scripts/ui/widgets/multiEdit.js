(function($, cloudStack) {
  var _medit = cloudStack.ui.widgets.multiEdit = {
    /**
     * Append item to list
     */
    addItem: function(data, fields, $multi, itemData, actions, options) {
      if (!options) options = {};

      var $tr;
      var $item = $('<div>').addClass('data-item');
      var multiRule = data;
      
      $item.append($('<table>').append($('<tbody>')));
      $tr = $('<tr>').appendTo($item.find('tbody'));

      if (itemData) {
        $tr.data('multi-edit-data', itemData);
      }

      // Setup columns
      $.each(fields, function(fieldName, field) {
        if (options.ignoreEmptyFields && !data[fieldName]) {
          return true;
        }
        var $td = $('<td>').addClass(fieldName).appendTo($tr);
        var $input, val;
        var $addButton = $multi.find('form .button.add-vm:not(.custom-action)').clone();
        var newItemRows = [];
        var addItemAction = function(data) {
          var $loading = $('<div>').addClass('loading-overlay');
          var complete = function(args) {
            var $tbody = $item.find('.expandable-listing tbody');
            
            $loading.remove();
            $(data).each(function() {
              var item = this;
              var $itemRow = _medit.multiItem.itemRow(item, options.itemActions, multiRule, $tbody);

              $itemRow.appendTo($tbody);
              newItemRows.push($itemRow);
              
              cloudStack.evenOdd($tbody, 'tr:visible', {
                even: function($elem) {
                  $elem.removeClass('odd');
                  $elem.addClass('even');
                },
                odd: function($elem) {
                  $elem.removeClass('even');
                  $elem.addClass('odd');
                }
              });
            });
          };
          var error = function() {
            $(newItemRows).each(function() {
              var $itemRow = this;
              
              $itemRow.remove();
            });
            $loading.remove();
          };

          $loading.prependTo($item);
          options.itemActions.add.action({
            context: options.context,
            data: data,
            multiRule: multiRule,
            response: {
              success: function(args) {
                var notificationError = function(args) {
                  error();
                };
                
                cloudStack.ui.notifications.add(args.notification,
                                                complete, {},
                                                notificationError, {});
              },
              error: error
            }
          });
        };

        if ($multi.find('th,td').filter(function() {
          return $(this).attr('rel') == fieldName;
        }).is(':hidden')) return true;

        if (!field.isPassword) {
          if (field.edit) {
            // Edit fields append value of data
            if (field.range) {
              var start = data[field.range[0]];
              var end = data[field.range[1]];

              $td.append($('<span>').html(start + ' - ' + end));
            } else {
              var maxLengths = data['_maxLength'];
              
              if (maxLengths &&
                  maxLengths[fieldName] &&
                  data[fieldName].length >= maxLengths[fieldName]) {
                $td.append($('<span>').html(data[fieldName].toString().substr(0, maxLengths[fieldName] - 3).concat('...')));
              } else {
                $td.append($('<span>').html(data[fieldName]));
              }
              $td.attr('title', data[fieldName]);
            }
          } else if (field.select) {
            $td.append($('<span>').html(
              // Get matching option text
              $multi.find('select').filter(function() {
                return $(this).attr('name') == fieldName;
              }).find('option').filter(function() {
                return $(this).val() == data[fieldName];
              }).html()));
          } else if (field.addButton && $.isArray(itemData) && !options.noSelect) {
            if (options.multipleAdd) {              
              $addButton.click(function() {
                _medit.vmList($multi,
                              options.listView,
                              options.context,
                              options.multipleAdd, _l('label.add.vms'),
                              addItemAction,
                              {
                                multiRule: multiRule
                              });
              });
              $td.append($addButton);
            } else {
              // Show VM data
              $td.html(options.multipleAdd ?
                       itemData.length + ' VMs' : itemData[0].name);
              $td.click(function() {
                var $browser = $(this).closest('.detail-view').data('view-args').$browser;

                if (options.multipleAdd) {
                  _medit.multiItem.details(itemData, $browser);
                } else {
                  _medit.details(itemData[0], $browser, { context: options.context });
                }
              });
            }
          } else if (field.custom) {
            var $button = $('<div>').addClass('button add-vm custom-action');
            
            $td.data('multi-custom-data', data[fieldName]);            
            $button.html(data && data[fieldName] && data[fieldName]['_buttonLabel'] ?
                         _l(data[fieldName]['_buttonLabel']) : _l(field.custom.buttonLabel));
            $button.click(function() {
              var $button = $(this);
              
              field.custom.action({
                context: options.context ? options.context : cloudStack.context,
                data: $td.data('multi-custom-data'),
                $item: $td,
                response: {
                  success: function(args) {
                    if (args.data['_buttonLabel']) {
                      $button.html(_l(args.data['_buttonLabel']));
                    }
                    $td.data('multi-custom-data', args.data);
                  }
                }
              });
            });
            $button.appendTo($td);
          }
        }

        // Add blank styling for empty fields
        if ($td.html() == '') {
          $td.addClass('blank');
        }

        // Align width to main header
        var targetWidth = $multi.find('th.' + fieldName).width() + 5;
        $td.width(targetWidth);

        return true;
      });

      // Actions column
      var $actions = $('<td>').addClass('multi-actions').appendTo($item.find('tr'));

      // Align action column width
      $actions.width($multi.find('th.multi-actions').width() + 4);

      // Action filter
      var allowedActions = options.preFilter ? options.preFilter({
        context: $.extend(true, {}, options.context, {
          multiRule: [data],
          actions: $.map(actions, function(value, key) { return key; })
        })
      }) : null;

      // Append actions
      $.each(actions, function(actionID, action) {
        if (allowedActions && $.inArray(actionID, allowedActions) == -1) return true;

        $actions.append(
          $('<div>').addClass('action')
            .addClass(actionID)
            .append($('<span>').addClass('icon'))
            .attr({ title: _l(action.label) })
            .click(function() {
              var $target = $(this);
              var $dataItem = $target.closest('.data-item');
              var $expandable = $dataItem.find('.expandable-listing');
              var isDestroy = $target.hasClass('destroy');

              if (isDestroy) {
                var $loading = _medit.loadingItem($multi, _l('label.removing') + '...');

                if ($expandable.is(':visible')) {
                  $expandable.slideToggle(function() {
                    $dataItem.hide();
                    $dataItem.after($loading);
                  });
                } else {
                  // Loading appearance
                  $dataItem.hide();
                  $dataItem.after($loading);
                }
              }

              action.action({
                context: $.extend(true, {}, options.context, {
                  multiRule: [data]
                }),
                response: {
                  success: function(args) {
                    var notification = args ? args.notification : null;
                    var _custom = args ? args._custom : null;
                    if (notification) {
                      $('.notifications').notifications('add', {
                        section: 'network',
                        desc: notification.label,
                        interval: 3000,
                        _custom: _custom,
                        poll: function(args) {
                          var complete = args.complete;
                          var error = args.error;

                          notification.poll({
                            _custom: args._custom,
                            complete: function(args) {
                              if (isDestroy) {
                                $loading.remove();
                                $dataItem.remove();
                              } else {
                                $multi.trigger('refresh');
                              }

                              complete();
                            },
                            error: function(args) {
                              error(args);
                              $loading.remove();
                              $dataItem.show();

                              return cloudStack.dialog.error;
                            }
                          });
                        }
                      });
                    } else {
                      $loading.remove();
                      if (isDestroy) {
                        $dataItem.remove();
                      }
                    }
                  },
                  error: cloudStack.dialog.error
                }
              });
            })
        );
      });

      // Add expandable listing, for multiple-item
      if (options.multipleAdd) {
        // Create expandable box
        _medit.multiItem.expandable($item.find('tr').data('multi-edit-data'),
                                    options.itemActions,
                                    multiRule).appendTo($item);
        
        // Expandable icon/action
        $item.find('td:first').prepend(
          $('<div>').addClass('expand').click(function() {
            $item.closest('.data-item').find('.expandable-listing').slideToggle();
          }));
      }

      return $item;
    },

    vmList: function($multi, listView, context, isMultipleAdd, label, complete, options) {
      if (!options) options = {};
      
      // Create a listing of instances, based on limited information
      // from main instances list view
      var $listView;
      var instances = $.extend(true, {}, listView, {
        context: $.extend(true, {}, context, {
          multiRule: options.multiRule ? [options.multiRule] : null
        }),
        uiCustom: true
      });

      instances.listView.actions = {
        select: {
          label: 'Select instance',
          type: isMultipleAdd ? 'checkbox' : 'radio',
          action: {
            uiCustom: function(args) {
              var $item = args.$item;
              var $input = $item.find('td.actions input:visible');

              if ($input.attr('type') == 'checkbox') {
                if ($input.is(':checked'))
                  $item.addClass('multi-edit-selected');
                else
                  $item.removeClass('multi-edit-selected');
              } else {
                $item.siblings().removeClass('multi-edit-selected');
                $item.addClass('multi-edit-selected');
              }
            }
          }
        }
      };

      $listView = $('<div>').listView(instances);

      // Change action label
      $listView.find('th.actions').html(_l('Select'));

      var $dataList = $listView.dialog({
        dialogClass: 'multi-edit-add-list panel',
        width: 825,
        title: label,
        buttons: [
          {
            text: _l('label.apply'),
            'class': 'ok',
            click: function() {
              if (!$listView.find('input[type=radio]:checked, input[type=checkbox]:checked').size()) {
                cloudStack.dialog.notice({ message: _l('message.select.item')});

                return false;
              }

              $dataList.fadeOut(function() {
                complete($.map(
                  $listView.find('tr.multi-edit-selected'),

                  // Attach VM data to row
                  function(elem) {
                    return $(elem).data('json-obj');
                  }
                ));
                $dataList.remove();
              });

              $('div.overlay').fadeOut(function() {
                $('div.overlay').remove();
              });

              return true;
            }
          },
          {
            text: _l('label.cancel'),
            'class': 'cancel',
            click: function() {
              $dataList.fadeOut(function() {
                $dataList.remove();
              });
              $('div.overlay').fadeOut(function() {
                $('div.overlay').remove();
              });
            }
          }
        ]
      }).parent('.ui-dialog').overlay();
    },

    /**
     * Align width of each data row to main header
     */
    refreshItemWidths: function($multi) {
      $multi.find('.data tr').filter(function() {
        return !$(this).closest('.expandable-listing').size();
      }).each(function() {
        var $tr = $(this);
        $tr.find('td').each(function() {
          var $td = $(this);

          $td.width($($multi.find('th:visible')[$td.index()]).width() + 5);
        });
      });
    },

    /**
     * Create a fake 'loading' item box
     */
    loadingItem: function($multi, label) {
      var $loading = $('<div>').addClass('data-item loading');

      // Align height with existing items
      var $row = $multi.find('.data-item:first');

      // Set label
      if (label) {
        $loading.append(
          $('<div>').addClass('label').append(
            $('<span>').html(_l(label))
          )
        );
      }

      return $loading;
    },
    details: function(data, $browser, options) {
      if (!options) options = {};

      var detailViewArgs, $detailView;

      detailViewArgs = $.extend(true, {}, cloudStack.sections.instances.listView.detailView);
      detailViewArgs.actions = null;
      detailViewArgs.$browser = $browser;
      detailViewArgs.id = data.id;
      detailViewArgs.jsonObj = data[0];
      detailViewArgs.context = options.context;

      $browser.cloudBrowser('addPanel', {
        title: data.name,
        complete: function($newPanel) {
          $newPanel.detailView(detailViewArgs);
        }
      });
    },
    multiItem: {
      /**
       * Show listing of load balanced VMs
       */
      details: function(data, $browser) {
        var listViewArgs, $listView;

        // Setup list view
        listViewArgs = $.extend(true, {}, cloudStack.sections.instances);
        listViewArgs.listView.actions = null;
        listViewArgs.listView.filters = null;
        listViewArgs.$browser = $browser;
        listViewArgs.listView.detailView.actions = null;
        listViewArgs.listView.dataProvider = function(args) {
          setTimeout(function() {
            args.response.success({
              data: data
            });
          }, 50);
        };
        $listView = $('<div>').listView(listViewArgs);

        // Show list view of selected VMs
        $browser.cloudBrowser('addPanel', {
          title: _l('label.item.listing'),
          data: '',
          noSelectPanel: true,
          maximizeIfSelected: true,
          complete: function($newPanel) {
            return $newPanel.listView(listViewArgs);
          }
        });
      },

      itemRow: function(item, itemActions, multiRule, $tbody) {
        var $tr = $('<tr>');

        $tr.append($('<td></td>').appendTo($tr).html(item.name));

        if (itemActions) {
          var $itemActions = $('<td>').addClass('actions item-actions');

          $.each(itemActions, function(itemActionID, itemAction) {
            if (itemActionID == 'add') return true;
            
            var $itemAction = $('<div>').addClass('action').addClass(itemActionID);

            $itemAction.click(function() {
              itemAction.action({
                item: item,
                multiRule: multiRule,
                response: {
                  success: function(args) {
                    if (itemActionID == 'destroy') {
                      var notification = args.notification;
                      var success = function(args) { $tr.remove(); };
                      var successArgs = {};
                      var error = function(args) {
                        $tr.show();
                        cloudStack.evenOdd($tbody, 'tr:visible', {
                          even: function($elem) {
                            $elem.removeClass('odd');
                            $elem.addClass('even');
                          },
                          odd: function($elem) {
                            $elem.removeClass('even');
                            $elem.addClass('odd');
                          }
                        });
                      };
                      var errorArgs = {};

                      $tr.hide();
                      cloudStack.evenOdd($tbody, 'tr:visible', {
                        even: function($elem) {
                          $elem.removeClass('odd');
                          $elem.addClass('even');
                        },
                        odd: function($elem) {
                          $elem.removeClass('even');
                          $elem.addClass('odd');
                        }
                      });
                      cloudStack.ui.notifications.add(notification,
                                                      success, successArgs,
                                                      error, errorArgs);
                    }
                  },
                  error: function(message) {
                    if (message) {
                      cloudStack.dialog.notice({ message: message });
                    }
                  }
                }
              });
            });
            $itemAction.append($('<span>').addClass('icon'));
            $itemAction.appendTo($itemActions);

            return true;
          });

          $itemActions.appendTo($tr);
        }

        return $tr;
      },

      expandable: function(data, itemActions, multiRule) {
        var $expandable = $('<div>').addClass('expandable-listing');
        var $tbody = $('<tbody>').appendTo($('<table>').appendTo($expandable));

        $(data).each(function() {
          var field = this;
          var $tr = _medit.multiItem.itemRow(field, itemActions, multiRule, $tbody).appendTo($tbody);

          cloudStack.evenOdd($tbody, 'tr', {
            even: function($elem) {
              $elem.addClass('even');
            },
            odd: function($elem) {
              $elem.addClass('odd');
            }
          });          
        });

        return $expandable.hide();
      }
    }
  };

  $.fn.multiEdit = function(args) {
    var dataProvider = args.dataProvider;
    var multipleAdd = args.multipleAdd;
    var $multi = $('<div>').addClass('multi-edit').appendTo(this);
    var $multiForm = $('<form>').appendTo($multi);
    var $inputTable = $('<table>').addClass('multi-edit').appendTo($multiForm);
    var $dataTable = $('<div>').addClass('data').appendTo($multi);
    var $addVM;
    var fields = args.fields;
    var actions = args.actions;
    var itemActions = multipleAdd ? args.itemActions : null;
    var noSelect = args.noSelect;
    var context = args.context;
    var ignoreEmptyFields = args.ignoreEmptyFields;
    var actionPreFilter = args.actionPreFilter;

    var $thead = $('<tr>').appendTo(
      $('<thead>').appendTo($inputTable)
    );
    var $inputForm = $('<tr>').appendTo(
      $('<tbody>').appendTo($inputTable)
    );
    var $dataBody = $('<div>').addClass('data-body').appendTo($dataTable);

    // Setup input table headers
    $.each(args.fields, function(fieldName, field) {
      var $th = $('<th>').addClass(fieldName).html(_l(field.label.toString()));
      $th.attr('rel', fieldName);
      $th.appendTo($thead);
      var $td = $('<td>').addClass(fieldName);
      $td.attr('rel', fieldName);
      $td.appendTo($inputForm);

      if (field.isHidden) {
        $th.hide();
        $td.hide();
      }

      if (field.select) {
        var $select = $('<select>');
        
        $select.attr({
          name: fieldName
        });
        $select.appendTo($td);
        field.select({
          $select: $select,
          $form: $multiForm,
          response: {
            success: function(args) {
              $(args.data).each(function() {
                $('<option>').val(this.name).html(this.description)
                  .appendTo($select);
              });
              _medit.refreshItemWidths($multi);
            },

            error: function(args) { }
          }
        });
      } else if (field.edit && field.edit != 'ignore') {
        if (field.range) {
          var $range = $('<div>').addClass('range').appendTo($td);

          $(field.range).each(function() {
            $('<input>')
              .attr({
                name: this,
                type: 'text'
              })
              .addClass(!field.isOptional ? 'required' : null)
              .attr('disabled', field.isDisabled ? 'disabled' : false)
              .appendTo(
                $('<div>').addClass('range-item').appendTo($range)
              );
          });
        } else {
          $('<input>')
            .attr({
              name: fieldName,
              type: field.isPassword ? 'password' : 'text'
            })
            .addClass(!field.isOptional ? 'required' : null)
            .attr('disabled', field.isDisabled ? 'disabled' : false)
            .appendTo($td);
        }
      } else if (field.custom) {
        $('<div>').addClass('button add-vm custom-action')
          .html(_l(field.custom.buttonLabel))
          .click(function() {
            field.custom.action({
              context: context,
              data: $td.data('multi-custom-data'),
              response: {
                success: function(args) {
                  $td.data('multi-custom-data', args.data);
                }
              }
            });
          }).appendTo($td);
      } else if (field.addButton) {
        $addVM = $('<div>').addClass('button add-vm').html(
          _l(args.add.label)
        ).appendTo($td);
      }
    });

    if (args.actions && !args.noHeaderActionsColumn) {
      $thead.append($('<th></th>').html(_l('label.actions')).addClass('multi-actions'));
      $inputForm.append($('<td></td>').addClass('multi-actions'));
    }

    $addVM.bind('click', function() {
      // Validate form first
      if (!$multiForm.valid()) {
        if ($multiForm.find('input.error:visible').size()) {
          return false;
        }
      }

      var $dataList;
      var addItem = function(itemData) {
        var data = {};

        $.each(cloudStack.serializeForm($multiForm), function(key, value) {
          if (value != '') {
            data[key] = value;
          }
        });

        // Append custom data
        var $customFields = $multi.find('tbody td').filter(function() {
          return $(this).data('multi-custom-data');
        });

        $customFields.each(function() {
          var $field = $(this);
          var fieldID = $field.attr('rel');
          var fieldData = $field.data('multi-custom-data');

          data[fieldID] = fieldData;
        });

        // Loading appearance
        var $loading = _medit.loadingItem($multi, _l('label.adding') + '...');
        $dataBody.prepend($loading);

        // Clear out fields
        $multi.find('input').val('');
        $multi.find('tbody td').each(function() {
          var $item = $(this);

          if ($item.data('multi-custom-data')) {
            $item.data('multi-custom-data', null);
          }
        });

        // Apply action
        args.add.action({
          context: context,
          data: data,
          itemData: itemData,
          response: {
            success: function(successArgs) {
              var notification = successArgs ? successArgs.notification : null;
              if (notification) {
                $('.notifications').notifications('add', {
                  section: 'network',
                  desc: notification.label,
                  interval: 3000,
                  _custom: successArgs._custom,
                  poll: function(pollArgs) {
                    var complete = pollArgs.complete;
                    var error = pollArgs.error;

                    notification.poll({
                      _custom: pollArgs._custom,
                      complete: function(completeArgs) {
                        complete(args);
                        $loading.remove();
                        getData();
                      },

                      error: function(args) {
                        error(args);
                        $loading.remove();

                        return cloudStack.dialog.error(args);
                      }
                    });
                  }
                });
              } else {
                $loading.remove();
                getData();
              }
            },

            error: cloudStack.dialog.error(function() {
              $loading.remove();
            })
          }
        });
      };

      if (args.noSelect) {
        // Don't append instance data
        addItem([]);

        return true;
      }

      _medit.vmList($multi,
                    args.listView,
                    args.context,
                    multipleAdd, _l('label.add.vms'),
                    addItem);

      return true;
    });

    var listView = args.listView;
    var getData = function() {
      dataProvider({
        context: context,
        response: {
          success: function(args) {
            $multi.find('.data-item').remove();
            $(args.data).each(function() {
              var data = this;
              var itemData = this._itemData;
              
              _medit.addItem(
                data,
                fields,
                $multi,
                itemData,
                actions,
                {
                  multipleAdd: multipleAdd,
                  itemActions: itemActions,
                  noSelect: noSelect,
                  context: $.extend(true, {}, context, this._context),
                  ignoreEmptyFields: ignoreEmptyFields,
                  preFilter: actionPreFilter,
                  listView: listView
                }
              ).appendTo($dataBody);
            });

            _medit.refreshItemWidths($multi);
          },
          error: cloudStack.dialog.error
        }
      });
    };

    if (args.hideForm && args.hideForm()){
      $multiForm.find('tbody').detach();
    }

    // Get existing data
    getData();

    var fullRefreshEvent = function(event) {
      if ($multi.is(':visible')) {
        getData();
      } else {
        $(window).unbind('cloudStack.fullRefresh', fullRefreshEvent);
      }
    };
    $(window).bind('cloudStack.fullRefresh', fullRefreshEvent);
    $multi.bind('refresh', fullRefreshEvent);

    $multi.bind('change select', function() {
      _medit.refreshItemWidths($multi);
    });

    $multiForm.validate();

    return this;
  };

})(jQuery, cloudStack);
